import { defineConfig } from 'vite';
import { resolve } from 'path';
import { writeFileSync } from 'fs';

export default defineConfig({
  plugins: [
    {
      name: 'generate-demo-html',
      closeBundle() {
        writeFileSync(
          resolve(__dirname, 'dist/index.html'),
          `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Wikifield — демо</title>
  <link rel="stylesheet" href="./wikifield.css">
</head>
<body>
  <div id="app" class="app"></div>
  <script type="module">
    import { createEditor } from './wikifield.js';
    const editor = createEditor('#app');
    editor.setMarkdown(\`# Заголовок
Привет, **мир**! Это *редактор* с ~~поддержкой~~ Markdown.

\\\`\\\`\\\`plantuml
@startuml
Alice -> Bob: Привет!
@enduml
\\\`\\\`\\\`

$$E = mc^2$$
\`);
  </script>
</body>
</html>`
        );
      },
    },
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/js/build-entry.js'),
      name: 'Wikifield',
      fileName: (format) => (format === 'es' ? 'wikifield.js' : 'wikifield.umd.cjs'),
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => assetInfo.name === 'style.css' ? 'wikifield.css' : assetInfo.name,
        exports: 'named',
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    minify: false,
    cssMinify: false,
    cssCodeSplit: false,
  },
});
