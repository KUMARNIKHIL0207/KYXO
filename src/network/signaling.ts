import { QR_TTL_MS } from '../app/constants';
import { createSessionPayload, isSessionExpired, parseSessionPayload, SessionPayload } from '../qr/session';

export type SignalingRole = 'offer' | 'answer';

export interface SignalingEnvelope {
  version: number;
  sid: string;
  pub: string;
  offer: string;
  exp: number;
  kind: SignalingRole;
}

export class LocalSignalingTransport {
  encode(payload: SignalingEnvelope): string {
    const session = createSessionPayload();
    session.id = payload.sid;
    session.publicKey = payload.pub;
    session.offer = payload.offer;
    session.expiresAt = payload.exp;
    session.payload = `${payload.kind === 'offer' ? 'KYXO://pair' : 'KYXO://pair'}?${encodeURIComponent([
      `v=${payload.version}`,
      `sid=${payload.sid}`,
      `pub=${payload.pub}`,
      `offer=${payload.offer}`,
      `exp=${payload.exp}`,
    ].join('\n'))}`;
    return session.payload;
  }

  decode(raw: string): SignalingEnvelope {
    const parsed = parseSessionPayload(raw);
    if (isSessionExpired(parsed.exp)) {
      throw new Error('Expired signaling payload');
    }

    return {
      version: parsed.version,
      sid: parsed.sid,
      pub: parsed.pub,
      offer: parsed.offer,
      exp: parsed.exp,
      kind: 'offer',
    };
  }
}

export function createSignalingEnvelope({ sid, pub, offer, kind, exp = Date.now() + QR_TTL_MS }: Partial<SignalingEnvelope> & { sid: string; pub: string; offer: string; kind: SignalingRole; exp?: number }): string {
  const payload = [
    `v=${1}`,
    `sid=${sid}`,
    `pub=${pub}`,
    `offer=${offer}`,
    `exp=${exp}`,
  ].join('\n');
  return `${'KYXO://pair'}?${encodeURIComponent(payload)}`;
}

export function parseSignalingEnvelope(raw: string): SessionPayload {
  return parseSessionPayload(raw);
}
