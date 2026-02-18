/**
 * Точка входа для сборки. Импортирует стили и делегирует в entry.js.
 * При загрузке без бандлера используйте index.html с <link> на css/styles.css.
 */
import '../css/styles.css';
import './entry.js';

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
} from './entry.js';
