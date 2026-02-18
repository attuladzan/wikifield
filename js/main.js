/**
 * Точка входа приложения.
 * Инициализация редактора с плагинами и обработчиками.
 */
import { Editor } from './core/Editor.js';
import { MarkdownHandlerRegistry } from './handlers/MarkdownHandlerRegistry.js';
import { tableHandler } from './handlers/TableHandler.js';
import { MathHandler } from './handlers/MathHandler.js';
import { CodeHandler } from './handlers/CodeHandler.js';
import { PlantUmlHandler } from './handlers/PlantUmlHandler.js';
import { defaultPlugins } from './plugins/index.js';

const handlers = new MarkdownHandlerRegistry();
handlers.register(tableHandler);
handlers.register(new MathHandler());
handlers.register(new PlantUmlHandler());
handlers.register(new CodeHandler());

const editor = new Editor('#app', {
  plugins: defaultPlugins,
  handlers
});

// Пример: установка начального контента с PlantUML и формулой (для проверки round-trip)
editor.setMarkdown(`# Заголовок
Привет, **мир**! Это *редактор* с ~~поддержкой~~ Markdown.

\`\`\`plantuml
@startuml
Alice -> Bob: Привет!
@enduml
\`\`\`

$$E = mc^2$$
`);
