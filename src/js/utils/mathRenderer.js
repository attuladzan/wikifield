/**
 * Рендеринг LaTeX-формул в визуальное представление через KaTeX.
 */
import katex from 'katex';

/**
 * Рендерит LaTeX в HTML-строку.
 * @param {string} latex - исходный LaTeX
 * @param {boolean} displayMode - блочный режим (true) или инлайн (false)
 * @returns {string} HTML-разметка формулы или fallback на исходный текст при ошибке
 */
export function renderMath(latex, displayMode = false) {
  if (!katex?.renderToString) {
    return escapeFallback(latex, displayMode);
  }
  try {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: false
    });
  } catch (_) {
    return escapeFallback(latex, displayMode);
  }
}

/**
 * Рендерит LaTeX в DOM-элемент (заменяет содержимое).
 * @param {HTMLElement} el - контейнер
 * @param {string} latex - исходный LaTeX
 * @param {boolean} displayMode - блочный режим
 */
export function renderMathInto(el, latex, displayMode = false) {
  if (!katex?.render) {
    el.textContent = displayMode ? `$$${latex}$$` : `$${latex}$`;
    return;
  }
  try {
    katex.render(latex, el, {
      displayMode,
      throwOnError: false
    });
  } catch (_) {
    el.textContent = displayMode ? `$$${latex}$$` : `$${latex}$`;
  }
}

function escapeFallback(latex, displayMode) {
  const div = document.createElement('div');
  div.textContent = displayMode ? `$$${latex}$$` : `$${latex}$`;
  return div.innerHTML;
}
