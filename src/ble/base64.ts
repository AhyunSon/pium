const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** ASCII 문자열 → base64. BLE 명령은 ASCII만 씁니다. */
export function encodeBase64(text: string): string {
  if (typeof globalThis.btoa === 'function') return globalThis.btoa(text);
  let out = '';
  let i = 0;
  while (i < text.length) {
    const a = text.charCodeAt(i++);
    const b = i < text.length ? text.charCodeAt(i++) : NaN;
    const c = i < text.length ? text.charCodeAt(i++) : NaN;
    const n = (a << 16) | ((b || 0) << 8) | (c || 0);
    out += CHARS[(n >> 18) & 63] + CHARS[(n >> 12) & 63];
    out += isNaN(b) ? '=' : CHARS[(n >> 6) & 63];
    out += isNaN(c) ? '=' : CHARS[n & 63];
  }
  return out;
}

export function decodeBase64(b64: string): string {
  if (typeof globalThis.atob === 'function') return globalThis.atob(b64);
  const clean = b64.replace(/[^A-Za-z0-9+/]/g, '');
  let out = '';
  let buffer = 0;
  let bits = 0;
  for (const ch of clean) {
    buffer = (buffer << 6) | CHARS.indexOf(ch);
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }
  return out;
}
