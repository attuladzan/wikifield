/**
 * Обработчик PlantUML диаграмм в Markdown.
 * Синтаксис: ```plantuml
 * ...код...
 * ```
 */
import { PLANTUML_CONFIG } from '../config/plantuml.js';
import { encodePlantUmlSync } from '../utils/plantumlEncoder.js';

export class PlantUmlHandler {
  name = 'plantuml';
  priority = 44;

  static BLOCK_CLASS = 'editor__plantuml-block';

  parseToDom(line, lines, i, _context) {
    const openMatch = line.match(/^```plantuml\s*$/i);
    if (!openMatch) return null;

    const codeLines = [];
    let idx = i + 1;

    while (idx < lines.length) {
      if (lines[idx].trim() === '```') {
        idx++;
        break;
      }
      codeLines.push(lines[idx]);
      idx++;
    }

    const source = codeLines.join('\n').trim() || '@startuml\n@enduml';
    const sourceAttr = source.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/\n/g, '&#10;');
    const sourceEscaped = source.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const encoded = encodePlantUmlSync(source);
    const base = PLANTUML_CONFIG.getBaseUrl();
    const fmt = PLANTUML_CONFIG.format || 'png';
    const url = `${base}/${fmt}/${encoded}`;

    return {
      html: `<div class="${PlantUmlHandler.BLOCK_CLASS}" data-plantuml-source="${sourceAttr}" contenteditable="false"><img src="${url}" alt="PlantUML diagram"><pre class="editor__plantuml-source"><code>${sourceEscaped}</code></pre></div>`,
      consumed: idx
    };
  }

  serializeFromDom(node, _context) {
    if (!node.classList?.contains(PlantUmlHandler.BLOCK_CLASS)) return undefined;
    const sourceEl = node.querySelector('.editor__plantuml-source code');
    const source = node.dataset?.plantumlSource ?? sourceEl?.textContent ?? '';
    return `\`\`\`plantuml\n${source}\n\`\`\`\n\n`;
  }
}
