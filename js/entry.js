/**
 * Единая точка входа для Wikifield.
 * При загрузке без бандлера добавьте в HTML: <link rel="stylesheet" href="css/styles.css">
 */
import { initHotkeyCapture } from './hotkeyCapture.js';
import { Editor } from './core/Editor.js';
import { MarkdownHandlerRegistry } from './handlers/MarkdownHandlerRegistry.js';
import { tableHandler } from './handlers/TableHandler.js';
import { MathHandler } from './handlers/MathHandler.js';
import { CodeHandler } from './handlers/CodeHandler.js';
import { PlantUmlHandler } from './handlers/PlantUmlHandler.js';
import { defaultPlugins } from './plugins/index.js';

initHotkeyCapture();

const defaultHandlers = new MarkdownHandlerRegistry();
defaultHandlers.register(tableHandler);
defaultHandlers.register(new MathHandler());
defaultHandlers.register(new PlantUmlHandler());
defaultHandlers.register(new CodeHandler());

/**
 * Создаёт экземпляр редактора.
 * @param {string|HTMLElement} container - селектор или DOM-элемент
 * @param {Object} options - опции редактора
 * @param {Array} [options.plugins] - плагины (по умолчанию — defaultPlugins)
 * @param {MarkdownHandlerRegistry} [options.handlers] - обработчики (по умолчанию — defaultHandlers)
 * @returns {Editor}
 */
function createEditor(container, options = {}) {
  return new Editor(container, {
    plugins: options.plugins ?? defaultPlugins,
    handlers: options.handlers ?? defaultHandlers,
    ...options
  });
}

export {
  Editor,
  createEditor,
  defaultPlugins,
  defaultHandlers,
  MarkdownHandlerRegistry,
  tableHandler,
  MathHandler,
  CodeHandler,
  PlantUmlHandler
};
