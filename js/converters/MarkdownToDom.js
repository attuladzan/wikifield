/**
 * Конвертация Markdown в DOM/HTML.
 * Поддерживает расширение через реестр обработчиков.
 */
export class MarkdownToDom {
  static convert(markdown, handlerRegistry) {
    if (!markdown || !markdown.trim()) return '';

    const lines = markdown.split(/\r?\n/);
    const blocks = [];
    let i = 0;

    const handlers = handlerRegistry?.getHandlers?.() ?? [];

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();
      let handled = false;

      for (const h of handlers) {
        if (h.parseToDom) {
          const result = h.parseToDom(trimmed ? trimmed : line, lines, i, { handlerRegistry });
          if (result) {
            blocks.push(result.html);
            i = result.consumed ?? i + 1;
            handled = true;
            break;
          }
        }
      }
      if (handled) continue;

      if (trimmed.startsWith('#')) {
        const match = trimmed.match(/^(#{1,6})\s+(.*)$/);
        if (match) {
          const level = match[1].length;
          blocks.push(`<h${level}>${this.#parseInline(match[2], handlerRegistry)}</h${level}>`);
          i++;
          continue;
        }
      }

      const ulMatch = trimmed.match(/^[-*]\s+(.+)$/);
      const olMatch = trimmed.match(/^\d+\.\s+(.+)$/);
      if (ulMatch) {
        const { html, consumed } = this.#parseList(lines, i, 'ul', /^[-*]\s+/, handlerRegistry);
        blocks.push(html);
        i = consumed;
        continue;
      }
      if (olMatch) {
        const { html, consumed } = this.#parseList(lines, i, 'ol', /^\d+\.\s+/, handlerRegistry);
        blocks.push(html);
        i = consumed;
        continue;
      }

      if (trimmed === '') {
        i++;
        continue;
      }

      blocks.push(`<p>${this.#parseInline(trimmed, handlerRegistry)}</p>`);
      i++;
    }

    return blocks.join('');
  }

  static #parseInline(text, handlerRegistry) {
    const handlers = handlerRegistry?.getHandlers?.() ?? [];
    let result = text;

    for (const h of handlers) {
      if (h.parseInlineToDom) {
        const transformed = h.parseInlineToDom(result, { handlerRegistry });
        if (transformed !== undefined) result = transformed;
      }
    }

    return this.#parseInlineDefault(result);
  }

  static #parseList(lines, startIdx, tag, pattern, handlerRegistry) {
    const items = [];
    let i = startIdx;
    while (i < lines.length) {
      const m = lines[i].match(pattern);
      if (!m) break;
      items.push(this.#parseInline(m[1], handlerRegistry));
      i++;
    }
    const lis = items.map(content => `<li>${content}</li>`).join('');
    return { html: `<${tag}>${lis}</${tag}>`, consumed: i };
  }

  static #parseInlineDefault(text) {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/_(.+?)_/g, '<em>$1</em>')
      .replace(/~~(.+?)~~/g, '<s>$1</s>')
      .replace(/!\[([^\]]*)\]\(([^)]*)\)/g, (_, alt, url) => {
        const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
        return `<img class="editor__image" src="${esc(url)}" alt="${esc(alt)}">`;
      })
      .replace(/\[([^\]]*)\]\(([^)]*)\)/g, (_, text, url) => {
        const escaped = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
        return `<a href="${escaped(url)}">${escaped(text)}</a>`;
      })
      .replace(/`(.+?)`/g, '<code>$1</code>');
  }
}
