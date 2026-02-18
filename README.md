# Wikifield

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

Или из репозитория GitHub:

```bash
npm install github:owner/wikifield
```

## Быстрый старт

```html
<link rel="stylesheet" href="node_modules/wikifield/dist/wikifield.css">
<div id="editor"></div>
<script type="module">
  import { createEditor } from 'wikifield';
  createEditor('#editor');
</script>
```

С бандлером (Webpack, Vite и т.п.):

```javascript
import { createEditor } from 'wikifield';
import 'wikifield/style.css';

createEditor('#editor');
```

## Подключение без сборщика

Скачайте `wikifield.js` и `wikifield.css` из [релизов](https://github.com/owner/wikifield/releases), разместите в проекте:

```html
<link rel="stylesheet" href="path/to/wikifield.css">
<div id="editor"></div>
<script type="module">
  import { createEditor } from './path/to/wikifield.js';
  createEditor('#editor');
</script>
```

Или через UMD:

```html
<link rel="stylesheet" href="path/to/wikifield.css">
<div id="editor"></div>
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
import { defaultHandlers } from 'wikifield';

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
```

## Лицензия

MIT
