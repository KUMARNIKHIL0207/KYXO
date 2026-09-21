import { randomBytes } from 'node:crypto';

export interface LocalSession {
  sessionId: string;
  createdAt: number;
  expiresAt: number;
  initiator: string | null;
  peer: string | null;
  state: 'waiting' | 'signaling' | 'connected' | 'closed';
  token: string;
}

export function secureSessionId(prefix = 'kxo'): string {
  return `${prefix}-${randomBytes(16).toString('hex')}`;
}

export function createSession(): LocalSession {
  const now = Date.now();
  return {
    sessionId: secureSessionId(),
    createdAt: now,
    expiresAt: now + 60_000,
    initiator: null,
    peer: null,
    state: 'waiting',
    token: randomBytes(24).toString('hex'),
  };
}

export function isSessionExpired(session: LocalSession): boolean {
  return Date.now() > session.expiresAt;
}

export function validateSession(session: LocalSession | undefined): boolean {
  return !!session && !isSessionExpired(session);
}
