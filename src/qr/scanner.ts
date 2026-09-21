import jsQR from 'jsqr';
import { parseSessionPayload } from './session';

export function decodeQrPayload(raw: string): ReturnType<typeof parseSessionPayload> {
  return parseSessionPayload(raw);
}

export function tryReadQrFromImage(imageData: ImageData): { data: string } | null {
  const code = jsQR(imageData.data, imageData.width, imageData.height);
  return code ? { data: code.data } : null;
}
