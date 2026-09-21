import { describe, expect, it } from 'vitest';
import { createSessionPayload, isSessionExpired, parseSessionPayload } from '../src/qr/session';

describe('KYXO QR session logic', () => {
  it('creates a valid pairing payload with a secure session id and expiration', () => {
    const session = createSessionPayload();

    expect(session.id).toMatch(/^kxo-[a-f0-9]+$/i);
    expect(session.payload).toContain('KYXO://pair');
    expect(session.expiresAt).toBeGreaterThan(Date.now());
  });

  it('parses a valid QR payload back into session fields', () => {
    const session = createSessionPayload();
    const parsed = parseSessionPayload(session.payload);

    expect(parsed.sid).toBe(session.id);
    expect(parsed.pub).toBe(session.publicKey);
    expect(parsed.offer).toBe(session.offer);
    expect(parsed.exp).toBe(session.expiresAt);
  });

  it('detects expired sessions', () => {
    const session = createSessionPayload();
    const expired = { ...session, expiresAt: Date.now() - 1 };

    expect(isSessionExpired(expired.expiresAt)).toBe(true);
  });

  it('rejects tampered or invalid QR payloads', () => {
    expect(() => parseSessionPayload('KYXO://pair?bad=payload')).toThrow();
    expect(() => parseSessionPayload('not-a-valid-session')).toThrow();
  });
});
