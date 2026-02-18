# Wikifield

[![npm version](https://img.shields.io/npm/v/wikifield.svg)](https://www.npmjs.com/package/wikifield)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Визуальный редактор Markdown с поддержкой LaTeX (KaTeX), PlantUML, подсветкой кода и расширяемой системой плагинов.

## Возможности

- **Markdown** — bold, italic, strikethrough, ссылки, изображения, заголовки, списки, таблицы
- **LaTeX** — формулы через KaTeX (инлайн `$...$` и блочные `$$...$$`)
- **PlantUML** — диаграммы в блоках кода
- **Подсветка кода** — с указанием языка
- **Режим исходника** — переключение WYSIWYG ↔ Markdown

## Установка

```bash
npm install wikifield
```

Или из репозитория:

```bash
npm install github:attuladzan/wikifield
```

## Быстрый старт

### С бандлером (Vite, Webpack и т.п.)

```javascript
import { createEditor } from 'wikifield';
import 'wikifield/style.css';

createEditor('#editor');
```

### Без сборщика (ES-модули)

```html
<div id="editor"></div>
<link rel="stylesheet" href="node_modules/wikifield/dist/wikifield.css">
<script type="module">
  import { createEditor } from 'wikifield';
  createEditor('#editor');
</script>
```

### CDN (unpkg / jsdelivr)

```html
<div id="editor"></div>
<link rel="stylesheet" href="https://unpkg.com/wikifield@latest/dist/wikifield.css">
<script type="module">
  import { createEditor } from 'https://unpkg.com/wikifield@latest/dist/wikifield.js';
  createEditor('#editor');
</script>
```

> Для продакшена замените `@latest` на конкретную версию, например `@1.0.1`.

### UMD (без ES-модулей)

```html
<div id="editor"></div>
<link rel="stylesheet" href="path/to/wikifield.css">
<script src="path/to/wikifield.umd.cjs" defer></script>
<script>
  document.addEventListener('DOMContentLoaded', function() {
    Wikifield.createEditor('#editor');
  });
</script>
```

## API

### createEditor(container, options?)

| Параметр   | Тип                | Описание                              |
|-----------|--------------------|----------------------------------------|
| container | string \| HTMLElement | Селектор или DOM-элемент              |
| options.plugins | Array        | Плагины тулбара (по умолчанию — все) |
| options.handlers | MarkdownHandlerRegistry | Обработчики Markdown               |

**Пример:**

```javascript
const editor = createEditor('#editor', {
  plugins: [/* свои плагины */],
});

editor.setMarkdown('# Привет\n**мир**');
const markdown = editor.getMarkdown();
```

### Методы Editor

- `getMarkdown()` — получить Markdown
- `setMarkdown(str)` — установить Markdown
- `focus()` — фокус на редактор

## Расширение

### Плагин тулбара

```javascript
import { createEditor, defaultPlugins } from 'wikifield';

const myPlugin = {
  id: 'mybutton',
  group: 'format',
  label: 'Кнопка',
  icon: '<span>X</span>',
  action(editor) {
    // действие при клике
  },
};

createEditor('#editor', { plugins: [myPlugin, ...defaultPlugins] });
```

### Обработчик Markdown

```javascript
import { createEditor, defaultHandlers } from 'wikifield';

defaultHandlers.register({
  name: 'myblock',
  priority: 50,
  parseToDom(line, lines, i, context) {
    if (line.startsWith(':::')) {
      return { html: '<div class="custom">...</div>', consumed: 1 };
    }
    return null;
  },
  serializeFromDom(node, context) {
    if (node.classList?.contains('custom')) return ':::\n...';
    return undefined;
  },
});

createEditor('#editor');
```

## Ссылки

- [npm](https://www.npmjs.com/package/wikifield)
- [GitHub](https://github.com/attuladzan/wikifield)
- [Issues](https://github.com/attuladzan/wikifield/issues)

## Лицензия

MIT
