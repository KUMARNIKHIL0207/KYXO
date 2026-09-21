import { createLocalSession, getLocalSignalUrl } from '../../local-host/server';
import { createSessionPayload } from '../qr/session';

export interface LocalHostSessionPayload {
  sid: string;
  host: string;
  port: number;
  path: string;
  token: string;
  exp: number;
}

export function createLocalHostSession(): LocalHostSessionPayload {
  const session = createLocalSession();
  return {
    sid: session.sessionId,
    host: '127.0.0.1',
    port: 4174,
    path: '/kyxo-signal',
    token: session.token,
    exp: session.expiresAt,
  };
}

export function buildLocalHostQrPayload(): string {
  const session = createLocalHostSession();
  const data = [
    `v=${1}`,
    `sid=${session.sid}`,
    `host=${session.host}`,
    `port=${session.port}`,
    `path=${session.path}`,
    `token=${session.token}`,
    `exp=${session.exp}`,
  ].join('\n');

  const qr = createSessionPayload();
  qr.id = session.sid;
  qr.offer = encodeURIComponent(data);
  qr.expiresAt = session.exp;
  qr.payload = `${'KYXO://pair'}?${encodeURIComponent(data)}`;
  return qr.payload;
}

export function resolveHostDetails(raw: string): LocalHostSessionPayload {
  const normalized = raw.startsWith('KYXO://pair?') ? raw.slice('KYXO://pair?'.length) : raw;
  const decoded = decodeURIComponent(normalized).replace(/\n/g, '&');
  const parsed = new URLSearchParams(decoded);
  const sid = parsed.get('sid');
  const host = parsed.get('host');
  const port = Number(parsed.get('port'));
  const path = parsed.get('path') ?? '/kyxo-signal';
  const token = parsed.get('token');
  const exp = Number(parsed.get('exp'));

  if (!sid || !host || !Number.isFinite(port) || !token || !Number.isFinite(exp)) {
    throw new Error('Invalid local host QR payload');
  }

  return {
    sid,
    host,
    port,
    path,
    token,
    exp,
  };
}

export function getLocalHostUrl(): string {
  return getLocalSignalUrl(createLocalSession());
}
