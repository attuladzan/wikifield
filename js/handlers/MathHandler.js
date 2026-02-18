/**
 * Обработчик математических формул (LaTeX).
 * Рендерит формулы визуально через KaTeX.
 *
 * Синтаксис в markdown:
 *   - Блок: $$формула$$
 *   - Инлайн: $формула$
 */
import { renderMath } from '../utils/mathRenderer.js';

export class MathHandler {
  name = 'math';
  priority = 50;

  static MATH_INLINE = 'editor__math-inline';
  static MATH_BLOCK = 'editor__math-block';

  /** Блочные формулы: $$...$$ (однострочные) или $$ \n ... \n $$ (многострочные) */
  parseToDom(line, lines, i, _context) {
    const singleLine = line.match(/^\s*\$\$(.+)\$\$\s*$/);
    if (singleLine) {
      const formula = singleLine[1].trim();
      const escaped = formula.replace(/"/g, '&quot;').replace(/\n/g, '&#10;');
      const rendered = renderMath(formula, true);
      return {
        html: `<div class="${MathHandler.MATH_BLOCK}" data-latex="${escaped}" contenteditable="false">${rendered}</div>`,
        consumed: i + 1
      };
    }
    const openMatch = line.match(/^\s*\$\$\s*$/);
    if (openMatch) {
      const formulaLines = [];
      let idx = i + 1;
      while (idx < lines.length) {
        if (lines[idx].trim() === '$$') {
          idx++;
          break;
        }
        formulaLines.push(lines[idx]);
        idx++;
      }
      const formula = formulaLines.join('\n').trim();
      const escaped = formula.replace(/"/g, '&quot;').replace(/\n/g, '&#10;');
      const rendered = renderMath(formula, true);
      return {
        html: `<div class="${MathHandler.MATH_BLOCK}" data-latex="${escaped}" contenteditable="false">${rendered}</div>`,
        consumed: idx
      };
    }
    return null;
  }

  /** Инлайн формулы: $...$ */
  parseInlineToDom(text, _context) {
    return text.replace(/\$([^$\n]+)\$/g, (_, formula) => {
      const trimmed = formula.trim();
      const escaped = trimmed.replace(/"/g, '&quot;');
      const rendered = renderMath(trimmed, false);
      return `<span class="${MathHandler.MATH_INLINE}" data-latex="${escaped}" contenteditable="false">${rendered}</span>`;
    });
  }

  serializeFromDom(node, _context) {
    if (node.classList?.contains(MathHandler.MATH_INLINE)) {
      return `$${node.dataset?.latex ?? node.textContent?.replace(/^\$|\$$/g, '')}$`;
    }
    if (node.classList?.contains(MathHandler.MATH_BLOCK)) {
      const latex = node.dataset?.latex ?? node.textContent?.replace(/^\$\$?|\$\$?$/g, '') ?? '';
      return `$$${latex}$$\n\n`;
    }
    return undefined;
  }
}
