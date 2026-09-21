export function secureRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

export function randomId(prefix: string, bytes = 16): string {
  const token = secureRandomBytes(bytes).reduce((acc, value) => {
    const hex = value.toString(16).padStart(2, '0');
    return acc + hex;
  }, '');

  return `${prefix}-${token}`;
}
