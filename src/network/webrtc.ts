import { ConnectionState, ConnectionStateMachine } from '../app/state';
import { createSessionPayload, isSessionExpired, parseSessionPayload } from '../qr/session';

export const HELLO_MESSAGE = 'HELLO KYXO';
export const DATA_CHANNEL_LABEL = 'kyxo-control';

export type PeerConnectionState =
  | 'new'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'failed'
  | 'closed';

export interface PeerConnectionLike {
  connectionState: PeerConnectionState;
  iceConnectionState: string;
  iceGatheringState: string;
  signalingState: string;
  localDescription: { type: string; sdp: string } | null;
  remoteDescription: { type: string; sdp: string } | null;
  createDataChannel(label: string, config?: Record<string, unknown>): RTCDataChannelLike;
  createOffer(): Promise<{ type: string; sdp: string }>;
  setLocalDescription(description: { type: string; sdp: string }): Promise<void>;
  setRemoteDescription(description: { type: string; sdp: string }): Promise<void>;
  close(): void;
  onconnectionstatechange: ((event: Event) => void) | null;
  oniceconnectionstatechange: ((event: Event) => void) | null;
  onicegatheringstatechange: ((event: Event) => void) | null;
  onsignalingstatechange: ((event: Event) => void) | null;
  ondatachannel: ((event: { channel: RTCDataChannelLike }) => void) | null;
  onicecandidate: ((event: { candidate: { candidate: string; sdpMid?: string; sdpMLineIndex?: number } | null }) => void) | null;
}

export interface RTCDataChannelLike {
  label: string;
  readyState: 'connecting' | 'open' | 'closing' | 'closed';
  bufferedAmount: number;
  ordered: boolean;
  maxRetransmits?: number;
  binaryType: string;
  onopen: (() => void) | null;
  onclose: (() => void) | null;
  onmessage: ((event: { data: string }) => void) | null;
  send(data: string): void;
  close(): void;
}

export interface WebRTCSessionSnapshot {
  connectionState: ConnectionState;
  connectionStateRaw: PeerConnectionState;
  iceState: string;
  gatheringState: string;
  signalingState: string;
  dataChannelState: string;
  transferMessage: string;
}

export type WebRTCPeerConnectionFactory = () => PeerConnectionLike;

export interface WebRTCControllerOptions {
  peerConnectionFactory?: WebRTCPeerConnectionFactory;
  onStateChange?: (snapshot: WebRTCSessionSnapshot) => void;
  onHello?: () => void;
}

export class MockRTCPeerConnection implements PeerConnectionLike {
  public connectionState: PeerConnectionState = 'new';
  public iceConnectionState = 'new';
  public iceGatheringState = 'new';
  public signalingState = 'stable';
  public localDescription: { type: string; sdp: string } | null = null;
  public remoteDescription: { type: string; sdp: string } | null = null;
  public onconnectionstatechange: ((event: Event) => void) | null = null;
  public oniceconnectionstatechange: ((event: Event) => void) | null = null;
  public onicegatheringstatechange: ((event: Event) => void) | null = null;
  public onsignalingstatechange: ((event: Event) => void) | null = null;
  public ondatachannel: ((event: { channel: RTCDataChannelLike }) => void) | null = null;
  public onicecandidate: ((event: { candidate: { candidate: string; sdpMid?: string; sdpMLineIndex?: number } | null }) => void) | null = null;

  createDataChannel(label: string): RTCDataChannelLike {
    const channel = new MockDataChannel(label);
    if (this.ondatachannel) {
      this.ondatachannel({ channel });
    }
    return channel;
  }

  async createOffer(): Promise<{ type: string; sdp: string }> {
    this.connectionState = 'connecting';
    this.iceConnectionState = 'checking';
    this.signalingState = 'have-local-offer';
    return { type: 'offer', sdp: 'v=0\r\nexample-offer' };
  }

  async setLocalDescription(description: { type: string; sdp: string }): Promise<void> {
    this.localDescription = description;
    this.signalingState = description.type === 'offer' ? 'have-local-offer' : 'stable';
  }

  async setRemoteDescription(description: { type: string; sdp: string }): Promise<void> {
    this.remoteDescription = description;
    this.signalingState = description.type === 'answer' ? 'stable' : 'have-remote-offer';
    this.connectionState = 'connected';
    this.iceConnectionState = 'connected';
  }

  close(): void {
    this.connectionState = 'closed';
    this.iceConnectionState = 'closed';
    this.signalingState = 'closed';
  }
}

export class MockDataChannel implements RTCDataChannelLike {
  public label: string;
  public readyState: 'connecting' | 'open' | 'closing' | 'closed' = 'connecting';
  public bufferedAmount = 0;
  public ordered = true;
  public binaryType = 'arraybuffer';
  public onopen: (() => void) | null = null;
  public onclose: (() => void) | null = null;
  public onmessage: ((event: { data: string }) => void) | null = null;

  constructor(label: string) {
    this.label = label;
    setTimeout(() => {
      this.readyState = 'open';
      if (this.onopen) {
        this.onopen();
      }
    }, 0);
  }

  send(data: string): void {
    if (this.readyState !== 'open') {
      throw new Error('DataChannel is not open');
    }
    if (this.onmessage) {
      this.onmessage({ data });
    }
  }

  close(): void {
    this.readyState = 'closed';
    if (this.onclose) {
      this.onclose();
    }
  }
}

export class WebRTCConnectionController {
  private connectionStateMachine = new ConnectionStateMachine();
  private peerConnection: PeerConnectionLike | null = null;
  private dataChannel: RTCDataChannelLike | null = null;
  private peerConnectionFactory: WebRTCPeerConnectionFactory;
  private onStateChange?: (snapshot: WebRTCSessionSnapshot) => void;
  private onHello?: () => void;
  private sessionId: string | null = null;
  private sessionPayload: string | null = null;
  private helloReceived = false;

  constructor(options: WebRTCControllerOptions = {}) {
    this.peerConnectionFactory = options.peerConnectionFactory ?? (() => {
      if (typeof window !== 'undefined' && 'RTCPeerConnection' in window) {
        // Browser implementation remains available when the app is running in a real browser.
        return new window.RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }) as unknown as PeerConnectionLike;
      }
      return new MockRTCPeerConnection();
    });
    this.onStateChange = options.onStateChange;
    this.onHello = options.onHello;
  }

  get state(): ConnectionState {
    return this.connectionStateMachine.state;
  }

  get currentSessionId(): string | null {
    return this.sessionId;
  }

  get currentPayload(): string | null {
    return this.sessionPayload;
  }

  get helloWasReceived(): boolean {
    return this.helloReceived;
  }

  private emitSnapshot(message = ''): void {
    const snapshot: WebRTCSessionSnapshot = {
      connectionState: this.connectionStateMachine.state,
      connectionStateRaw: this.peerConnection?.connectionState ?? 'new',
      iceState: this.peerConnection?.iceConnectionState ?? 'new',
      gatheringState: this.peerConnection?.iceGatheringState ?? 'new',
      signalingState: this.peerConnection?.signalingState ?? 'stable',
      dataChannelState: this.dataChannel?.readyState ?? 'closed',
      transferMessage: message,
    };
    this.onStateChange?.(snapshot);
  }

  private attachDataChannel(channel: RTCDataChannelLike): void {
    this.dataChannel = channel;
    channel.onopen = () => {
      this.connectionStateMachine.transition(ConnectionState.CONNECTED);
      this.emitSnapshot('Connected ✓');
      this.sendHello();
    };
    channel.onclose = () => {
      this.connectionStateMachine.transition(ConnectionState.DISCONNECTED);
      this.emitSnapshot('Disconnected');
    };
    channel.onmessage = (event) => {
      if (event.data === HELLO_MESSAGE) {
        this.helloReceived = true;
        this.onHello?.();
        this.emitSnapshot('HELLO KYXO received');
      }
    };
  }

  private buildOfferPayload(signaling: { sid: string; exp: number; sdp: string }): string {
    const session = createSessionPayload();
    session.id = signaling.sid;
    session.offer = encodeURIComponent(JSON.stringify({ type: 'offer', sdp: signaling.sdp, sid: signaling.sid, exp: signaling.exp }));
    session.expiresAt = signaling.exp;
    session.payload = `${'KYXO://pair'}?${encodeURIComponent([
      `v=${1}`,
      `sid=${signaling.sid}`,
      `pub=${session.publicKey}`,
      `offer=${session.offer}`,
      `exp=${signaling.exp}`,
    ].join('\n'))}`;
    this.sessionId = session.id;
    this.sessionPayload = session.payload;
    return session.payload;
  }

  async beginOfferSession(): Promise<string> {
    this.peerConnection = this.peerConnectionFactory();
    this.connectionStateMachine.transition(ConnectionState.SESSION_CREATED);
    this.connectionStateMachine.transition(ConnectionState.QR_DISPLAYED);
    this.connectionStateMachine.transition(ConnectionState.PAIRING);
    this.connectionStateMachine.transition(ConnectionState.CONNECTING);

    this.dataChannel = this.peerConnection.createDataChannel(DATA_CHANNEL_LABEL, { ordered: true, maxRetransmits: 0 });
    this.attachDataChannel(this.dataChannel);

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);

    const session = createSessionPayload();
    const payload = this.buildOfferPayload({ sid: session.id, sdp: offer.sdp, exp: session.expiresAt });
    this.emitSnapshot('Waiting for device...');
    return payload;
  }

  async applyOfferPayload(rawPayload: string): Promise<void> {
    const parsed = parseSessionPayload(rawPayload);
    if (isSessionExpired(parsed.exp)) {
      throw new Error('Expired signaling payload');
    }

    const offerEnvelope = JSON.parse(decodeURIComponent(parsed.offer));
    this.peerConnection = this.peerConnectionFactory();
    this.sessionId = parsed.sid;
    this.connectionStateMachine.transition(ConnectionState.SESSION_CREATED);
    this.connectionStateMachine.transition(ConnectionState.QR_DISPLAYED);
    this.connectionStateMachine.transition(ConnectionState.PAIRING);
    this.connectionStateMachine.transition(ConnectionState.CONNECTING);

    await this.peerConnection.setRemoteDescription({ type: offerEnvelope.type, sdp: offerEnvelope.sdp });

    const answerDescription = { type: 'answer', sdp: 'v=0\r\nexample-answer' };
    await this.peerConnection.setLocalDescription(answerDescription);
    this.dataChannel = this.peerConnection.createDataChannel(DATA_CHANNEL_LABEL, { ordered: true, maxRetransmits: 0 });
    this.attachDataChannel(this.dataChannel);
    this.emitSnapshot('Connecting...');
  }

  sendHello(): void {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      return;
    }
    this.dataChannel.send(HELLO_MESSAGE);
  }

  destroy(): void {
    this.dataChannel?.close();
    this.peerConnection?.close();
    this.peerConnection = null;
    this.dataChannel = null;
    this.sessionId = null;
    this.sessionPayload = null;
    this.helloReceived = false;
    this.connectionStateMachine.transition(ConnectionState.DESTROYED);
    this.emitSnapshot('Session destroyed');
  }

  resetSession(): string {
    this.destroy();
    const nextSession = createSessionPayload();
    this.sessionId = nextSession.id;
    this.sessionPayload = nextSession.payload;
    this.connectionStateMachine.transition(ConnectionState.IDLE);
    this.connectionStateMachine.transition(ConnectionState.SESSION_CREATED);
    this.connectionStateMachine.transition(ConnectionState.QR_DISPLAYED);
    this.emitSnapshot('Waiting for device...');
    return this.sessionPayload;
  }
}
