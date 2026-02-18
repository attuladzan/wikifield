/**
 * Обработчик Markdown-таблиц.
 * Синтаксис: | A | B | C |
 *           | - | - | - |
 *           | 1 | 2 | 3 |
 */
import { escapeHtml } from '../utils/html.js';

export const tableHandler = {
  name: 'table',
  priority: 40,

  parseToDom(line, lines, i, context) {
    const rowMatch = line.match(/^\|(.+)\|$/);
    if (!rowMatch) return null;

    const rows = [];
    let idx = i;

    while (idx < lines.length) {
      const rowLine = lines[idx];
      const m = rowLine.match(/^\|(.+)\|$/);
      if (!m) break;

      const cells = m[1].split(/\|/).map(c => c.trim());
      rows.push(cells);
      idx++;
    }

    if (rows.length < 2) return null;

    const separator = rows[1].every(c => /^[-:]+$/.test(c));
    if (!separator) return null;

    const headerRow = rows[0];
    const dataRows = rows.slice(2);
    const colCount = headerRow.length;

    let html = '<table class="editor__table"><thead><tr>';
    headerRow.forEach(cell => {
      html += `<th>${escapeHtml(cell)}</th>`;
    });
    html += '</tr></thead><tbody>';

    dataRows.forEach(row => {
      html += '<tr>';
      for (let j = 0; j < colCount; j++) {
        const cell = row[j] ?? '';
        html += `<td>${escapeHtml(cell)}</td>`;
      }
      html += '</tr>';
    });
    html += '</tbody></table>';

    return { html, consumed: idx };
  },

  serializeFromDom(node, context) {
    if (node.tagName?.toUpperCase() !== 'TABLE') return undefined;

    const rows = [];
    const trs = node.querySelectorAll('tr');
    trs.forEach(tr => {
      const cells = Array.from(tr.querySelectorAll('th, td')).map(cell =>
        cell.textContent.trim().replace(/\n/g, ' ')
      );
      if (cells.length) rows.push(cells);
    });

    if (rows.length === 0) return '';

    const colCount = Math.max(...rows.map(r => r.length));
    const pad = (arr, n) => [...arr, ...Array(Math.max(0, n - arr.length)).fill('')];

    let md = '';
    rows.forEach((row, i) => {
      const padded = pad(row, colCount);
      md += '| ' + padded.join(' | ') + ' |\n';
      if (i === 0) md += '| ' + padded.map(() => '---').join(' | ') + ' |\n';
    });
    return md + '\n\n';
  }
};
