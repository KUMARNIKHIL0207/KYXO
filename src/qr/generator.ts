import QRCode from 'qrcode';
import { buildQrContent, createSessionPayload, isSessionExpired } from './session';

export async function generateQrCode(data: string): Promise<string> {
  return QRCode.toDataURL(data, {
    margin: 1,
    errorCorrectionLevel: 'M',
    width: 220,
  });
}

export function createSessionForQr(): ReturnType<typeof createSessionPayload> {
  return createSessionPayload();
}

export function isQrSessionValid(session: { expiresAt: number }): boolean {
  return !isSessionExpired(session.expiresAt);
}

export function buildQrPayloadFromSession(session: { payload: string }): string {
  return buildQrContent(session.payload);
}
