/**
 * Обработчик блоков кода (```lang\ncode\n```).
 */
import { getLangLabel } from '../config/languages.js';
import { BLOCK_CLASSES } from '../constants/blockClasses.js';

export class CodeHandler {
  name = 'code';
  priority = 45;

  parseToDom(line, lines, i, _context) {
    const openMatch = line.match(/^```(\w*)\s*$/);
    if (!openMatch) return null;

    const lang = openMatch[1].trim();
    const codeLines = [];
    let idx = i + 1;

    while (idx < lines.length) {
      if (lines[idx].trim() === '```') {
        idx++;
        break;
      }
      codeLines.push(lines[idx]);
      idx++;
    }

    const code = codeLines.join('\n');
    const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const langAttr = lang ? ` data-lang="${lang.replace(/"/g, '&quot;')}"` : '';
    const langLabel = getLangLabel(lang);
    const langBar = lang ? `<span class="editor__code-block__lang">${langLabel.replace(/</g, '&lt;')}</span>` : '';

    return {
      html: `<div class="${BLOCK_CLASSES.CODE}" contenteditable="false">${langBar}<pre><code${langAttr}>${escaped}</code></pre></div>`,
      consumed: idx
    };
  }

  serializeFromDom(node, _context) {
    const tag = node.tagName?.toUpperCase();
    if ((tag !== 'PRE' && tag !== 'DIV') || !node.classList?.contains(BLOCK_CLASSES.CODE)) {
      return undefined;
    }
    const code = node.querySelector('code');
    if (!code) return undefined;

    const lang = code.dataset?.lang ?? Array.from(code.classList || []).find(c => c.startsWith('language-'))?.replace('language-', '') ?? '';
    const text = code.textContent ?? '';
    const fence = '```';
    return `${fence}${lang}\n${text}\n${fence}\n\n`;
  }
}
