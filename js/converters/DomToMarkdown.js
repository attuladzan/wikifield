/**
 * Конвертация DOM (contenteditable) в Markdown.
 * Использует реестр обработчиков для расширяемости.
 */
import { BLOCK_CLASSES } from '../constants/blockClasses.js';

export class DomToMarkdown {
  static #isBlockElement(node) {
    if (node.nodeType !== Node.ELEMENT_NODE) return false;
    const tag = node.tagName?.toUpperCase();
    if (tag === 'TABLE') return true;
    if (tag === 'PRE') return true;
    if (tag === 'DIV') {
      return (
        !!node.classList?.contains(BLOCK_CLASSES.CODE) ||
        !!node.classList?.contains(BLOCK_CLASSES.MATH) ||
        !!node.classList?.contains(BLOCK_CLASSES.PLANTUML)
      );
    }
    return false;
  }

  static convert(container, handlerRegistry) {
    const chunks = [];

    const processNode = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent || '';
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return '';

      const tag = node.tagName?.toUpperCase();
      const handlers = handlerRegistry?.getHandlers?.() ?? [];
      for (const h of handlers) {
        if (h.serializeFromDom) {
          const result = h.serializeFromDom(node, { handlerRegistry });
          if (result !== undefined) return result;
        }
      }

      if (tag === 'P') {
        const blockChildren = Array.from(node.childNodes).filter(n => this.#isBlockElement(n));
        if (blockChildren.length > 0) {
          const parts = [];
          let inlineAcc = '';
          for (const child of node.childNodes) {
            if (this.#isBlockElement(child)) {
              if (inlineAcc.trim()) parts.push(inlineAcc.trim());
              inlineAcc = '';
              const blockResult = processNode(child);
              if (blockResult) parts.push(blockResult);
            } else {
              inlineAcc += processNode(child);
            }
          }
          if (inlineAcc.trim()) parts.push(inlineAcc.trim());
          return parts.join('\n\n');
        }
      }

      const inner = Array.from(node.childNodes)
        .map(n => processNode(n))
        .join('');

      switch (tag) {
        case 'CODE': {
          const parent = node.parentElement;
          const grandParent = parent?.parentElement;
          if (parent?.tagName === 'PRE' || grandParent?.classList?.contains(BLOCK_CLASSES.CODE)) {
            return inner;
          }
          const fence = inner.includes('`') ? '``' : '`';
          return `${fence}${inner}${fence}`;
        }
        case 'PRE':
        case 'DIV': {
          if (node.classList?.contains(BLOCK_CLASSES.CODE)) {
            const code = node.querySelector('code');
            if (code) {
              const lang = code.dataset?.lang ?? '';
              return `\`\`\`${lang}\n${(code.textContent ?? '').replace(/\r/g, '')}\n\`\`\`\n\n`;
            }
          }
          if (tag === 'PRE') return inner + '\n\n';
          return `${inner}\n\n`;
        }
        case 'H1': return `# ${inner}\n\n`;
        case 'H2': return `## ${inner}\n\n`;
        case 'H3': return `### ${inner}\n\n`;
        case 'H4': return `#### ${inner}\n\n`;
        case 'H5': return `##### ${inner}\n\n`;
        case 'H6': return `###### ${inner}\n\n`;
        case 'B':
        case 'STRONG': return `**${inner}**`;
        case 'I':
        case 'EM': return `*${inner}*`;
        case 'S':
        case 'STRIKE': return `~~${inner}~~`;
        case 'A': {
          const href = node.getAttribute('href') || '';
          return href ? `[${inner}](${href})` : inner;
        }
        case 'IMG': {
          const src = node.getAttribute('src') || '';
          const alt = node.getAttribute('alt') || '';
          return src ? `![${alt}](${src})` : '';
        }
        case 'UL': return this.#serializeList(node, '-', processNode) + '\n\n';
        case 'OL': return this.#serializeList(node, '1.', processNode) + '\n\n';
        case 'LI': return inner;
        case 'P':
        case 'DIV': return `${inner}\n\n`;
        case 'BR': return '\n';
        default: return inner;
      }
    };

    Array.from(container.childNodes).forEach(node => {
      const result = processNode(node);
      if (result) chunks.push(result);
    });

    return chunks.join('').replace(/\n{3,}/g, '\n\n').trim();
  }

  static #serializeList(node, marker, processNode) {
    return Array.from(node.querySelectorAll(':scope > li'))
      .map((li, i) => {
        const prefix = marker === '1.' ? `${i + 1}.` : marker;
        const nested = li.querySelector(':scope > ul, :scope > ol');
        let line = `${prefix} ${Array.from(li.childNodes)
          .filter(n => n !== nested)
          .map(n => processNode(n))
          .join('')
          .trim()}`;
        if (nested) {
          const sub = processNode(nested).trim();
          line += '\n' + sub.replace(/^/gm, '  ');
        }
        return line;
      })
      .join('\n');
  }
}
