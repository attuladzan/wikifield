/**
 * Кодирование PlantUML для URL официального сервера.
 * По документации: deflate -> encode64 (PlantUML charset), без префикса.
 * Fallback: ~h + hex (для синхронного режима).
 */
const PLANTUML_CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_';

function encode64PlantUml(bytes) {
  const len = bytes.length;
  let result = '';
  for (let i = 0; i < len; i += 3) {
    const b1 = bytes[i] || 0;
    const b2 = bytes[i + 1];
    const b3 = bytes[i + 2];
    result += PLANTUML_CHARSET[b1 >> 2];
    result += PLANTUML_CHARSET[((b1 & 3) << 4) | (b2 >> 4)];
    if (b2 === undefined) break;
    result += PLANTUML_CHARSET[((b2 & 15) << 2) | (b3 >> 6)];
    if (b3 === undefined) break;
    result += PLANTUML_CHARSET[b3 & 63];
  }
  return result;
}

/**
 * HEX-формат (~h): каждый байт в hex. Синхронно, всегда работает.
 */
export function encodePlantUmlHex(source) {
  const text = String(source ?? '').trim();
  if (!text) return '';
  const bytes = new TextEncoder().encode(text);
  const hex = Array.from(new Uint8Array(bytes))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return '~h' + hex;
}

/**
 * Синхронное кодирование. Использует HEX (надёжно, но длинные URL).
 */
export function encodePlantUmlSync(source) {
  return encodePlantUmlHex(source);
}

/**
 * Асинхронное кодирование: deflate + encode64 (без префикса, как в документации).
 * @returns {Promise<string>}
 */
export async function encodePlantUml(source) {
  const text = String(source ?? '').trim();
  if (!text) return '';

  try {
    const pako = await import('https://cdn.jsdelivr.net/npm/pako@2.1.0/+esm');
    const bytes = new TextEncoder().encode(text);
    const deflated = pako.deflate(bytes, { raw: true, level: 9 });
    return encode64PlantUml(new Uint8Array(deflated));
  } catch (err) {
    console.warn('PlantUML encoder: pako failed, using hex fallback', err);
    return encodePlantUmlHex(text);
  }
}
