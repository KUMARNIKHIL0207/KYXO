import { describe, expect, it } from 'vitest';
import { buildLocalHostQrPayload, createLocalHostSession, resolveHostDetails } from '../src/network/local-host';

describe('KYXO local host signaling', () => {
  it('creates a session with local host metadata', () => {
    const session = createLocalHostSession();
    expect(session.sid).toMatch(/^kxo-/);
    expect(session.port).toBe(4174);
    expect(session.path).toBe('/kyxo-signal');
  });

  it('creates a valid QR payload containing local signaling details', () => {
    const payload = buildLocalHostQrPayload();
    expect(payload).toContain('KYXO://pair');
    expect(payload).toContain('v%3D1');
    expect(payload).toContain('sid%3D');
    expect(payload).toContain('host%3D127.0.0.1');
    expect(payload).toContain('token%3D');
  });

  it('validates a QR payload and extracts host metadata', () => {
    const payload = buildLocalHostQrPayload();
    const details = resolveHostDetails(payload.replace('KYXO://pair?', ''));
    expect(details.host).toBe('127.0.0.1');
    expect(details.port).toBe(4174);
    expect(details.path).toBe('/kyxo-signal');
  });

  it('rejects invalid local host payloads', () => {
    expect(() => resolveHostDetails('sid=bad&host=bad&port=nah')).toThrow();
  });
});
