import { KYXO_PAIR_PREFIX, KYXO_PROTOCOL, QR_TTL_MS, SESSION_VERSION } from '../app/constants';
import { randomId, secureRandomBytes } from '../utils/random';

export interface SessionPayload {
  version: number;
  sid: string;
  pub: string;
  offer: string;
  exp: number;
}

export interface QrSession {
  id: string;
  publicKey: string;
  offer: string;
  expiresAt: number;
  payload: string;
  isExpired: boolean;
}

export function encodeBase64Url(value: Uint8Array): string {
  let binary = '';
  value.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

export function decodeBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

export function createSessionPayload(): QrSession {
  const sid = randomId('kxo');
  const pub = encodeBase64Url(secureRandomBytes(32));
  const offer = encodeBase64Url(secureRandomBytes(48));
  const expiresAt = Date.now() + QR_TTL_MS;

  const payload: SessionPayload = {
    version: SESSION_VERSION,
    sid,
    pub,
    offer,
    exp: expiresAt,
  };

  const encoded = [
    `v=${payload.version}`,
    `sid=${payload.sid}`,
    `pub=${payload.pub}`,
    `offer=${payload.offer}`,
    `exp=${payload.exp}`,
  ].join('\n');

  return {
    id: sid,
    publicKey: pub,
    offer,
    expiresAt,
    payload: `${KYXO_PAIR_PREFIX}?${encodeURIComponent(encoded)}`,
    isExpired: false,
  };
}

export function parseSessionPayload(raw: string): SessionPayload {
  if (!raw || typeof raw !== 'string') {
    throw new Error('Invalid session payload');
  }

  const normalized = raw.trim();
  const withoutPrefix = normalized.startsWith(`${KYXO_PAIR_PREFIX}?`)
    ? normalized.slice(KYXO_PAIR_PREFIX.length + 1)
    : normalized;

  const decoded = decodeURIComponent(withoutPrefix);
  const pairs = decoded.includes('\n') ? decoded.split('\n') : decoded.split('&');
  const values = new Map<string, string>();

  for (const part of pairs) {
    if (!part) continue;
    const equalsIndex = part.indexOf('=');
    if (equalsIndex === -1) continue;
    const key = part.slice(0, equalsIndex).trim();
    const value = part.slice(equalsIndex + 1).trim();
    if (key) {
      values.set(key, value);
    }
  }

  const version = Number(values.get('v'));
  const sid = values.get('sid');
  const pub = values.get('pub');
  const offer = values.get('offer');
  const exp = Number(values.get('exp'));

  if (!Number.isInteger(version) || version !== SESSION_VERSION) {
    throw new Error('Unsupported session version');
  }
  if (!sid || !pub || !offer || !Number.isFinite(exp)) {
    throw new Error('Missing required session fields');
  }

  return {
    version,
    sid,
    pub,
    offer,
    exp,
  };
}

export function isSessionExpired(expiresAt: number): boolean {
  return Date.now() > expiresAt;
}

export function buildQrContent(payload: string): string {
  return `${KYXO_PROTOCOL}://${payload}`;
}

export function normalizePairingData(value: string): string {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== `${KYXO_PROTOCOL}:`) {
      throw new Error('Invalid protocol');
    }
    return parsed.toString();
  } catch {
    return value;
  }
}
