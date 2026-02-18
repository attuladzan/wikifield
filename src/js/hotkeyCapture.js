/**
 * Ранний перехват горячих клавиш (загружается до main.js).
 * Регистрирует keydown на window с capture: true для приоритета над браузером.
 * Использует callback через window.__wikifieldHotkey для передачи в Editor.
 *
 * Поддерживаемые комбинации:
 * - Cmd/Ctrl+Z — undo
 * - Cmd/Ctrl+Shift+Z, Cmd/Ctrl+Y — redo
 * - Cmd/Ctrl+B — bold
 * - Cmd/Ctrl+I — italic
 * - Cmd/Ctrl+K — link
 */

const HOTKEY_MAP = {
  z: (shift) => (shift ? 'redo' : 'undo'),
  y: () => 'redo',
  b: () => 'bold',
  i: () => 'italic',
  k: () => 'link'
};

function getAction(e) {
  if (!(e.metaKey || e.ctrlKey) || e.altKey) return null;
  const key = (e.key && e.key.toLowerCase()) || '';
  const handler = HOTKEY_MAP[key];
  return handler ? handler(e.shiftKey) : null;
}

function isInEditor(el) {
  if (!el) return false;
  return (
    (el.closest && el.closest('[contenteditable="true"]')) ||
    (el.closest && el.closest('.editor')) ||
    (el.tagName === 'TEXTAREA' && el.classList && el.classList.contains('editor__source'))
  );
}

function onKeyDown(e) {
  const action = getAction(e);
  if (!action) return;

  if (!isInEditor(document.activeElement)) return;

  e.preventDefault();
  e.stopImmediatePropagation();

  const callback = window.__wikifieldHotkey;
  if (typeof callback === 'function') {
    callback(action);
  } else {
    window.dispatchEvent(new CustomEvent('wikifield-hotkey', { detail: { action } }));
  }
}

export function initHotkeyCapture() {
  window.__wikifieldHotkey = null;
  window.addEventListener('keydown', onKeyDown, true);
}
