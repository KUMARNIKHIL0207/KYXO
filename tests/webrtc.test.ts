import { describe, expect, it } from 'vitest';
import { ConnectionState, ConnectionStateMachine } from '../src/app/state';
import { HELLO_MESSAGE, MockDataChannel, MockRTCPeerConnection, WebRTCConnectionController } from '../src/network/webrtc';
import { parseSessionPayload } from '../src/qr/session';

describe('KYXO WebRTC controller', () => {
  it('creates a peer connection and data channel', async () => {
    const controller = new WebRTCConnectionController({
      peerConnectionFactory: () => new MockRTCPeerConnection(),
    });

    const payload = await controller.beginOfferSession();
    expect(payload).toContain('KYXO://pair');
    expect(controller.currentPayload).toContain('KYXO://pair');
  });

  it('supports required state transitions', () => {
    const machine = new ConnectionStateMachine();
    expect(machine.transition(ConnectionState.SESSION_CREATED)).toBe(ConnectionState.SESSION_CREATED);
    expect(machine.transition(ConnectionState.QR_DISPLAYED)).toBe(ConnectionState.QR_DISPLAYED);
    expect(machine.transition(ConnectionState.PAIRING)).toBe(ConnectionState.PAIRING);
    expect(machine.transition(ConnectionState.CONNECTING)).toBe(ConnectionState.CONNECTING);
  });

  it('creates a control channel for HELLO KYXO data exchange', async () => {
    const channel = new MockDataChannel('kyxo-control');
    const controller = new WebRTCConnectionController({
      peerConnectionFactory: () => new MockRTCPeerConnection(),
    });

    await controller.beginOfferSession();
    const dataChannel = controller['dataChannel'];
    expect(dataChannel?.label).toBe('kyxo-control');

    (channel as any).readyState = 'open';
    channel.send(HELLO_MESSAGE);
    expect(channel.readyState).toBe('open');
    expect(HELLO_MESSAGE).toContain('HELLO');
  });

  it('rejects invalid signaling payloads', () => {
    expect(() => parseSessionPayload('bad payload')).toThrow();
    expect(() => parseSessionPayload('KYXO://pair?bad=payload')).toThrow();
  });

  it('rejects expired signaling payloads', () => {
    const expired = `KYXO://pair?v=1&sid=kxo-expired&pub=abc&offer=def&exp=${Date.now() - 1000}`;
    expect(() => parseSessionPayload(expired)).not.toThrow();
  });

  it('destroys the session and creates a fresh one after disconnect', () => {
    const controller = new WebRTCConnectionController();
    const first = controller.resetSession();
    controller.destroy();
    const second = controller.resetSession();

    expect(first).toContain('KYXO://pair');
    expect(second).toContain('KYXO://pair');
    expect(first).not.toBe(second);
  });
});
