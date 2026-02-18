/**
 * Плагин: вставка кода.
 * Инлайн (`код`) или блок (```) с опциональным выбором языка.
 */
import { CODE_LANGUAGES, getLangLabel } from '../config/languages.js';
import { BLOCK_CLASSES } from '../constants/blockClasses.js';
import { escapeHtml } from '../utils/html.js';

const CODE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`;

export const codePlugin = {
  id: 'code',
  group: 'blocks',
  label: 'Код',
  icon: CODE_ICON,

  action(editor) {
    this._showInsertDialog?.(editor);
  },

  init(editor) {
    const el = editor.contentElement;
    if (!el) return;

    const handler = (e) => {
      const block = e.target.closest(`.${BLOCK_CLASSES.CODE}`);
      if (block) showCodeContextMenu(editor, block, e);
    };

    el.addEventListener('contextmenu', handler);
    this._teardown = () => el.removeEventListener('contextmenu', handler);
  },

  destroy() {
    this._teardown?.();
  },

  _insertCode(editor, code, lang = '', isBlock, targetBlock = null) {
    const text = (code ?? '').trim();

    if (targetBlock) {
      const codeEl = targetBlock.querySelector('code');
      const langBar = targetBlock.querySelector('.editor__code-block__lang');
      if (codeEl) {
        codeEl.textContent = text;
        if (lang) codeEl.dataset.lang = lang; else delete codeEl.dataset.lang;
      }
      if (langBar) {
        langBar.textContent = lang ? getLangLabel(lang) : '';
        langBar.style.display = lang ? '' : 'none';
      } else if (lang) {
        const bar = document.createElement('span');
        bar.className = 'editor__code-block__lang';
        bar.textContent = getLangLabel(lang);
        targetBlock.insertBefore(bar, targetBlock.firstChild);
      }
    } else {
      const sel = window.getSelection();
      const savedRange = sel?.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
      const contentEl = editor.contentElement;
      const inContent = contentEl && savedRange && contentEl.contains(savedRange?.commonAncestorContainer);

      if (savedRange && inContent) {
        sel.removeAllRanges();
        sel.addRange(savedRange);
      }

      if (isBlock) {
        const escaped = escapeHtml(text);
        const langAttr = lang ? ` data-lang="${lang.replace(/"/g, '&quot;')}"` : '';
        const langLabel = lang ? escapeHtml(getLangLabel(lang)) : '';
        const langBar = lang ? `<span class="editor__code-block__lang">${langLabel}</span>` : '';
        const html = `<div class="${BLOCK_CLASSES.CODE}" contenteditable="false">${langBar}<pre><code${langAttr}>${escaped}</code></pre></div>`;
        document.execCommand('insertHTML', false, html);
      } else {
        const hasSelection = sel && sel.rangeCount && !sel.isCollapsed;
        if (hasSelection) {
          document.execCommand('insertHTML', false, `<code class="editor__code-inline">${escapeHtml(text)}</code>`);
        } else {
          document.execCommand('insertHTML', false, `<code class="editor__code-inline">${escapeHtml(text || ' ')}</code>`);
        }
      }
    }
    editor.focus();
  },

  _showInsertDialog(editor, targetBlock = null, prefillCode = '', prefillLang = '') {
    const sel = window.getSelection();
    const savedRange = sel?.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
    const contentEl = editor.contentElement;
    const inContent = contentEl && savedRange && contentEl.contains(savedRange?.commonAncestorContainer);
    const hasSelection = sel && sel.rangeCount && !sel.isCollapsed;
    const prefill = prefillCode || (hasSelection ? sel.toString() : '');

    const wrap = document.createElement('div');
    wrap.className = 'editor__code-insert';
    wrap.innerHTML = `
      <div class="editor__code-insert__content">
        <div class="editor__code-insert__row">
          <label>Код
            <textarea class="editor__code-insert__textarea" data-code placeholder="Введите код..." rows="6"></textarea>
          </label>
        </div>
        <div class="editor__code-insert__row">
          <label>Язык (необязательно)
            <select class="editor__code-insert__select" data-lang>
              ${CODE_LANGUAGES.map(({ value, label }) => `<option value="${value}">${label}</option>`).join('')}
            </select>
          </label>
        </div>
        <div class="editor__code-insert__row">
          <label class="editor__code-insert__checkbox">
            <input type="checkbox" data-block ${targetBlock ? 'checked' : ''}> Блочный код (отдельный блок)
          </label>
        </div>
        <div class="editor__code-insert__actions">
          <button type="button" class="editor__code-insert__btn editor__code-insert__btn--primary" data-submit>Вставить</button>
          <button type="button" class="editor__code-insert__btn editor__code-insert__btn--cancel">Отмена</button>
        </div>
      </div>
    `;

    const codeInp = wrap.querySelector('[data-code]');
    const langSelect = wrap.querySelector('[data-lang]');
    const blockInp = wrap.querySelector('[data-block]');
    const submitBtn = wrap.querySelector('[data-submit]');

    codeInp.value = prefill;
    if (prefillLang) {
      const opt = langSelect.querySelector(`option[value="${prefillLang}"]`);
      if (opt) opt.selected = true; else langSelect.value = prefillLang;
    }

    const overlay = document.createElement('div');
    overlay.className = 'editor__code-insert__overlay';
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

    submitBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const code = codeInp.value;
      const lang = langSelect.value?.trim() || '';
      const isBlock = blockInp.checked;
      if (!code.trim() && !targetBlock) {
        codeInp.focus();
        return;
      }
      close();
      if (!targetBlock && savedRange && inContent) {
        const s = window.getSelection();
        s.removeAllRanges();
        s.addRange(savedRange);
      }
      this._insertCode(editor, code || ' ', lang, isBlock, targetBlock);
    });

    wrap.querySelector('.editor__code-insert__btn--cancel').addEventListener('click', () => close());

    document.body.appendChild(overlay);
    document.addEventListener('keydown', onKey);
    codeInp.focus();
  }
};

function showCodeContextMenu(editor, preBlock, e) {
  e.preventDefault();

  const codeEl = preBlock?.querySelector('code');
  const code = codeEl?.textContent ?? '';
  const lang = codeEl?.dataset?.lang ?? '';

  const menu = document.createElement('div');
  menu.className = 'editor__table-menu editor__code-menu';
  menu.innerHTML = `
    <button type="button" data-action="edit">Изменить</button>
    <button type="button" data-action="remove">Удалить</button>
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

    if (btn.dataset.action === 'edit') {
      close();
      codePlugin._showInsertDialog?.(editor, preBlock, code, lang);
    } else if (btn.dataset.action === 'remove') {
      preBlock.remove();
      editor.focus();
    }
    close();
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
