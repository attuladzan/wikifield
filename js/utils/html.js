/**
 * Утилиты для безопасной работы с HTML.
 */

/**
 * Экранирует строку для использования в HTML-атрибутах и содержимом.
 * @param {string} text
 * @returns {string}
 */
export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML;
}

/**
 * Экранирует строку для использования в атрибутах data-*.
 * @param {string} s
 * @returns {string}
 */
export function escapeAttr(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '&#10;');
}
