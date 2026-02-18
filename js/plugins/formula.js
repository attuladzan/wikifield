/**
 * Плагин: вставка математических формул (LaTeX).
 * Формулы рендерятся визуально через KaTeX.
 */
import { BLOCK_CLASSES } from '../constants/blockClasses.js';
import { escapeAttr } from '../utils/html.js';
import { renderMath, renderMathInto } from '../utils/mathRenderer.js';

const FORMULA_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19l5-7"/><path d="M9 12l5 7"/><path d="M14 5l-2 4"/><path d="M18 5l-2 4"/><path d="M2 12h2"/><path d="M20 12h2"/></svg>`;

const MATH_INLINE_CLASS = 'editor__math-inline';

export const formulaPlugin = {
  id: 'formula',
  group: 'blocks',
  label: 'Формула',
  icon: FORMULA_ICON,

  action(editor) {
    this._showInsertDialog?.(editor);
  },

  init(editor) {
    const el = editor.contentElement;
    if (!el) return;

    const handler = (e) => {
      const math = e.target.closest(`.${MATH_INLINE_CLASS}, .${BLOCK_CLASSES.MATH}`);
      if (math) showFormulaContextMenu(editor, math, e);
    };

    el.addEventListener('contextmenu', handler);
    this._teardown = () => el.removeEventListener('contextmenu', handler);
  },

  destroy() {
    this._teardown?.();
  },

  _insertFormula(editor, latex, isBlock, targetEl = null) {
    if (!latex?.trim()) return;

    const formula = latex.trim();

    if (targetEl) {
      targetEl.dataset.latex = formula;
      targetEl.innerHTML = '';
      renderMathInto(targetEl, formula, isBlock);
    } else {
      const contentEl = editor.contentElement;
      if (!contentEl) return;

      if (isBlock) {
        this._insertBlockFormulaAsChild(contentEl, formula);
      } else {
        const sel = window.getSelection();
        const savedRange = sel?.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
        const inContent = savedRange && contentEl.contains(savedRange?.commonAncestorContainer);
        if (savedRange && inContent) {
          sel.removeAllRanges();
          sel.addRange(savedRange);
        }
        const rendered = this._renderFormulaHtml(formula, false);
        const html = `<span class="${MATH_INLINE_CLASS}" data-latex="${escapeAttr(formula)}" contenteditable="false">${rendered}</span>`;
        document.execCommand('insertHTML', false, html);
      }
    }
    editor.focus();
  },

  _renderFormulaHtml(latex, isBlock) {
    return renderMath(latex, isBlock);
  },

  _insertBlockFormulaAsChild(contentEl, formula) {
    const div = document.createElement('div');
    div.className = BLOCK_CLASSES.MATH;
    div.dataset.latex = formula;
    div.setAttribute('contenteditable', 'false');
    renderMathInto(div, formula, true);

    const p = document.createElement('p');
    p.innerHTML = '<br>';

    const sel = window.getSelection();
    let insertBefore = null;
    let replaceBlock = null;

    if (sel?.rangeCount) {
      const range = sel.getRangeAt(0);
      let node = range.startContainer;
      if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
      if (node && contentEl.contains(node)) {
        let block = node;
        while (block && block !== contentEl) {
          if (['P', 'DIV', 'H1', 'H2', 'H3', 'LI', 'PRE'].includes(block.tagName) ||
              block.classList?.contains(BLOCK_CLASSES.MATH) ||
              block.classList?.contains(BLOCK_CLASSES.CODE) ||
              block.tagName === 'TABLE') {
            const isEmpty = block.tagName === 'P' && (!block.textContent?.trim() || block.innerHTML === '<br>');
            if (isEmpty) {
              replaceBlock = block;
            } else {
              insertBefore = block.nextSibling;
            }
            break;
          }
          block = block.parentElement;
        }
        if (!insertBefore && !replaceBlock) {
          insertBefore = node.nextElementSibling ?? node.nextSibling;
        }
      }
    }

    if (replaceBlock) {
      replaceBlock.replaceWith(div, p);
    } else if (insertBefore) {
      contentEl.insertBefore(div, insertBefore);
      contentEl.insertBefore(p, insertBefore);
    } else {
      contentEl.appendChild(div);
      contentEl.appendChild(p);
    }

    const newRange = document.createRange();
    newRange.setStart(p, 0);
    newRange.collapse(true);
    sel?.removeAllRanges();
    sel?.addRange(newRange);
  },

  _showInsertDialog(editor, targetEl = null, prefillLatex = '', prefillBlock = false) {
    const sel = window.getSelection();
    const savedRange = sel?.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
    const contentEl = editor.contentElement;
    const inContent = contentEl && savedRange && contentEl.contains(savedRange?.commonAncestorContainer);

    const wrap = document.createElement('div');
    wrap.className = 'editor__formula-insert';
    wrap.innerHTML = `
      <div class="editor__formula-insert__content">
        <div class="editor__formula-insert__row">
          <label>Формула LaTeX
            <textarea class="editor__formula-insert__textarea" data-latex placeholder="x^2 + y^2 = z^2" rows="3"></textarea>
          </label>
        </div>
        <div class="editor__formula-insert__row">
          <label class="editor__formula-insert__checkbox">
            <input type="checkbox" data-block> Блочная формула (отдельная строка)
          </label>
        </div>
        <div class="editor__formula-insert__actions">
          <button type="button" class="editor__formula-insert__btn editor__formula-insert__btn--primary" data-submit>Вставить</button>
          <button type="button" class="editor__formula-insert__btn editor__formula-insert__btn--cancel">Отмена</button>
        </div>
      </div>
    `;

    const latexInp = wrap.querySelector('[data-latex]');
    const blockInp = wrap.querySelector('[data-block]');
    const submitBtn = wrap.querySelector('[data-submit]');

    if (prefillLatex) latexInp.value = prefillLatex;
    if (prefillBlock) blockInp.checked = true;

    const overlay = document.createElement('div');
    overlay.className = 'editor__formula-insert__overlay';
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
      const latex = latexInp.value?.trim();
      if (!latex) {
        latexInp.focus();
        return;
      }
      const isBlock = blockInp.checked;
      close();
      if (!targetEl && savedRange && inContent) {
        const s = window.getSelection();
        s.removeAllRanges();
        s.addRange(savedRange);
      }
      this._insertFormula(editor, latex, isBlock, targetEl);
    });

    wrap.querySelector('.editor__formula-insert__btn--cancel').addEventListener('click', () => close());

    document.body.appendChild(overlay);
    document.addEventListener('keydown', onKey);
    latexInp.focus();
  }
};

function showFormulaContextMenu(editor, mathEl, e) {
  e.preventDefault();

  const menu = document.createElement('div');
  menu.className = 'editor__table-menu editor__formula-menu';
  menu.innerHTML = `
    <button type="button" data-action="edit">Изменить формулу</button>
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
      const latex = mathEl.dataset?.latex ?? mathEl.textContent?.replace(/^\$\$?|\$\$?$/g, '') ?? '';
      const isBlock = mathEl.classList.contains(BLOCK_CLASSES.MATH);
      close();
      formulaPlugin._showInsertDialog?.(editor, mathEl, latex, isBlock);
    } else if (btn.dataset.action === 'remove') {
      mathEl.remove();
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
