/**
 * Плагин: таблицы.
 * Вставка с выбором размера + контекстное меню для редактирования структуры.
 *
 * Отключение функционала — измените TABLE_FEATURES перед использованием:
 *   import { tablePlugin, TABLE_FEATURES } from './plugins/table.js';
 *   TABLE_FEATURES.insertSizeChoice = false;  // простая вставка 3×3
 *   TABLE_FEATURES.contextMenu = false;       // без контекстного меню
 */
export const TABLE_FEATURES = {
  insertSizeChoice: true,
  contextMenu: true
};

const TABLE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>`;

function insertTable(editor, rows, cols, savedSelection = null) {
  const contentEl = editor.contentElement;
  if (!contentEl) return;

  const sel = window.getSelection();
  sel.removeAllRanges();

  if (savedSelection && contentEl.contains(savedSelection.commonAncestorContainer)) {
    sel.addRange(savedSelection);
  } else {
    const range = document.createRange();
    range.selectNodeContents(contentEl);
    range.collapse(false);
    sel.addRange(range);
  }

  contentEl.focus();

  const r = Math.min(Math.max(rows, 1), 20);
  const c = Math.min(Math.max(cols, 1), 10);
  const headerCells = Array(c).fill('').map(() => `<th></th>`).join('');
  const dataRow = Array(c).fill('').map(() => '<td></td>').join('');
  const dataRows = Array(r - 1).fill(`<tr>${dataRow}</tr>`).join('');
  const html = `<table class="editor__table"><thead><tr>${headerCells}</tr></thead><tbody>${dataRows}</tbody></table>`;
  document.execCommand('insertHTML', false, html);
}

function getCellPosition(cell) {
  const tr = cell.closest('tr');
  const table = cell.closest('table');
  if (!tr || !table) return null;
  const rowIndex = Array.from(table.rows).indexOf(tr);
  const cellIndex = Array.from(tr.cells).indexOf(cell);
  return { table, tr, cell, rowIndex, cellIndex };
}

function insertRow(table, afterIndex, isHeader = false) {
  const colCount = table.rows[0]?.cells?.length ?? 0;
  if (colCount === 0) return;
  const tag = isHeader ? 'th' : 'td';
  const cells = Array(colCount).fill('').map(() => `<${tag}></${tag}>`).join('');
  const newTr = document.createElement('tr');
  newTr.innerHTML = cells;
  const target = table.rows[afterIndex];
  if (target) target.after(newTr);
  else if (afterIndex < 0 && table.rows[0]) {
    table.rows[0].before(newTr);
  }
  else table.querySelector('tbody')?.appendChild(newTr);
}

function insertColumn(table, afterIndex) {
  table.querySelectorAll('tr').forEach(tr => {
    const cell = document.createElement(tr.querySelector('th') ? 'th' : 'td');
    const target = tr.cells[afterIndex];
    if (target) target.after(cell);
    else tr.appendChild(cell);
  });
}

function deleteRow(table, rowIndex) {
  const row = table.rows[rowIndex];
  if (row && table.rows.length > 1) row.remove();
}

function deleteColumn(table, colIndex) {
  table.querySelectorAll('tr').forEach(tr => {
    const cell = tr.cells[colIndex];
    if (cell && tr.cells.length > 1) cell.remove();
  });
}

function showContextMenu(editor, cell, e) {
  if (!TABLE_FEATURES.contextMenu) return;
  const pos = getCellPosition(cell);
  if (!pos) return;

  e.preventDefault();
  const { table, rowIndex, cellIndex } = pos;

  const menu = document.createElement('div');
  menu.className = 'editor__table-menu';
  menu.innerHTML = `
    <button type="button" data-action="insertRowAbove">Добавить строку выше</button>
    <button type="button" data-action="insertRowBelow">Добавить строку ниже</button>
    <button type="button" data-action="insertColLeft">Добавить столбец слева</button>
    <button type="button" data-action="insertColRight">Добавить столбец справа</button>
    <hr>
    <button type="button" data-action="deleteRow">Удалить строку</button>
    <button type="button" data-action="deleteCol">Удалить столбец</button>
  `;

  const close = () => {
    menu.remove();
    document.removeEventListener('click', close);
    document.removeEventListener('scroll', close, true);
  };

  menu.style.left = `${e.clientX}px`;
  menu.style.top = `${e.clientY}px`;

  menu.addEventListener('click', (ev) => {
    const btn = ev.target.closest('button[data-action]');
    if (!btn) return;
    ev.stopPropagation();

    const theadRowCount = table.tHead ? table.tHead.rows.length : 0;
    const isHeaderRow = rowIndex < theadRowCount;

    switch (btn.dataset.action) {
      case 'insertRowAbove':
        insertRow(table, rowIndex === 0 ? -1 : rowIndex - 1, isHeaderRow);
        break;
      case 'insertRowBelow':
        insertRow(table, rowIndex, isHeaderRow && rowIndex < theadRowCount - 1);
        break;
      case 'insertColLeft':
        insertColumn(table, cellIndex);
        break;
      case 'insertColRight':
        insertColumn(table, cellIndex + 1);
        break;
      case 'deleteRow':
        deleteRow(table, rowIndex);
        break;
      case 'deleteCol':
        deleteColumn(table, cellIndex);
        break;
    }
    close();
    editor.focus();
  });

  document.body.appendChild(menu);
  requestAnimationFrame(() => {
    const r = menu.getBoundingClientRect();
    if (r.right > window.innerWidth) menu.style.left = `${e.clientX - r.width}px`;
    if (r.bottom > window.innerHeight) menu.style.top = `${e.clientY - r.height}px`;
  });

  document.addEventListener('click', close);
  document.addEventListener('scroll', close, true);
}

export const tablePlugin = {
  id: 'table',
  group: 'blocks',
  label: 'Таблица',
  icon: TABLE_ICON,
  features: TABLE_FEATURES,

  action(editor) {
    const saveSelection = () => {
      const sel = window.getSelection();
      const el = editor.contentElement;
      if (!el || !sel.rangeCount) return null;
      const range = sel.getRangeAt(0);
      if (!el.contains(range.commonAncestorContainer)) {
        const r = document.createRange();
        r.selectNodeContents(el);
        r.collapse(true);
        return r;
      }
      return range.cloneRange();
    };

    if (TABLE_FEATURES.insertSizeChoice && this._showInsertDialog) {
      this._showInsertDialog(editor, saveSelection());
    } else {
      insertTable(editor, 3, 3);
    }
  },

  init(editor) {
    if (!TABLE_FEATURES.contextMenu) return;

    const el = editor.contentElement;
    if (!el) return;

    const handler = (e) => {
      const cell = e.target.closest('.editor__table th, .editor__table td');
      if (cell) showContextMenu(editor, cell, e);
    };

    el.addEventListener('contextmenu', handler);
    this._teardown = () => el.removeEventListener('contextmenu', handler);
  },

  destroy() {
    this._teardown?.();
  },

  _showInsertDialog(editor, savedRange) {

    const wrap = document.createElement('div');
    wrap.className = 'editor__table-insert';
    wrap.innerHTML = `
      <div class="editor__table-insert__content">
        <label>Строки <input type="number" min="1" max="20" value="3" class="editor__table-insert__input" data-rows></label>
        <label>Столбцы <input type="number" min="1" max="10" value="3" class="editor__table-insert__input" data-cols></label>
        <button type="button" class="editor__table-insert__btn">Вставить</button>
      </div>
    `;

    const overlay = document.createElement('div');
    overlay.className = 'editor__table-insert__overlay';
    overlay.appendChild(wrap);

    const close = () => {
      overlay.remove();
      document.removeEventListener('keydown', onKey);
    };

    const onKey = (e) => {
      if (e.key === 'Escape') close();
    };

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });

    wrap.querySelector('button').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const rowsInp = wrap.querySelector('[data-rows]');
      const colsInp = wrap.querySelector('[data-cols]');
      const rows = parseInt(rowsInp?.value, 10) || 3;
      const cols = parseInt(colsInp?.value, 10) || 3;
      close();
      insertTable(editor, rows, cols, savedRange ?? undefined);
    });

    document.body.appendChild(overlay);
    document.addEventListener('keydown', onKey);
    wrap.querySelector('[data-rows]')?.focus();
  }
};
