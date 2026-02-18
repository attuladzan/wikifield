/**
 * Спецификация горячих клавиш редактора.
 * Реализация перехвата — js/hotkeyCapture.js (ранняя регистрация на window).
 *
 * | Комбинация        | Действие  |
 * |-------------------|-----------|
 * | Cmd/Ctrl+Z        | Undo      |
 * | Cmd/Ctrl+Shift+Z  | Redo      |
 * | Cmd/Ctrl+Y        | Redo      |
 * | Cmd/Ctrl+B        | Жирный    |
 * | Cmd/Ctrl+I        | Курсив    |
 * | Cmd/Ctrl+K        | Ссылка    |
 */
export const HOTKEY_ACTIONS = ['undo', 'redo', 'bold', 'italic', 'link'];
