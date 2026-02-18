/**
 * Реестр обработчиков Markdown.
 * Позволяет расширять парсинг и сериализацию markdown (формулы, кастомный синтаксис и т.д.).
 */
export class MarkdownHandlerRegistry {
  #handlers = [];

  /**
   * Регистрирует обработчик. Обработчик должен реализовывать:
   * - {string} name - уникальное имя
   * - {number} priority - порядок (меньше = раньше)
   * - {Function} parseToDom?(line, lines, i, context) - парсинг markdown-строки в HTML
   * - {Function} parseInlineToDom?(text, context) - парсинг инлайн markdown в HTML
   * - {Function} serializeFromDom?(node, context) - сериализация DOM-узла в markdown
   */
  register(handler) {
    if (!handler?.name) throw new Error('Handler must have name');
    const priority = handler.priority ?? 100;
    const idx = this.#handlers.findIndex(h => h.priority > priority);
    this.#handlers.splice(idx < 0 ? this.#handlers.length : idx, 0, handler);
  }

  /** Все обработчики по приоритету */
  getHandlers() {
    return [...this.#handlers];
  }
}
