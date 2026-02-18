/**
 * Плагин: вставка PlantUML диаграмм.
 * Рендеринг через официальный PlantUML сервер или настроенный proxy.
 *
 * Конфиг: js/config/plantuml.js
 */
import { PLANTUML_CONFIG } from '../config/plantuml.js';
import { encodePlantUml } from '../utils/plantumlEncoder.js';
import { BLOCK_CLASSES } from '../constants/blockClasses.js';

const PLANTUML_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="9" height="7" rx="1"/><rect x="13" y="13" width="9" height="7" rx="1"/><path d="M11 7.5h2l4 4.5"/><path d="M13 16.5h-2l-4-4.5"/></svg>`;

function getImageUrl(encoded) {
  const base = PLANTUML_CONFIG.getBaseUrl();
  const fmt = PLANTUML_CONFIG.format || 'png';
  return `${base}/${fmt}/${encoded}`;
}

export const plantumlPlugin = {
  id: 'plantuml',
  group: 'blocks',
  label: 'PlantUML',
  icon: PLANTUML_ICON,

  action(editor) {
    this._showInsertDialog?.(editor);
  },

  init(editor) {
    const el = editor.contentElement;
    if (!el) return;

    const handler = (e) => {
      const block = e.target.closest(`.${BLOCK_CLASSES.PLANTUML}`);
      if (block) showPlantumlContextMenu(editor, block, e);
    };

    el.addEventListener('contextmenu', handler);
    this._teardown = () => el.removeEventListener('contextmenu', handler);
  },

  destroy() {
    this._teardown?.();
  },

  async _insertPlantuml(editor, source, targetBlock = null) {
    const text = (source ?? '').trim();
    if (!text) return;

    if (targetBlock) {
      const img = targetBlock.querySelector('img');
      const codeEl = targetBlock.querySelector('.editor__plantuml-source code');
      if (img) {
        try {
          const encoded = await encodePlantUml(text);
          img.src = getImageUrl(encoded);
          img.alt = 'PlantUML diagram';
          targetBlock.dataset.plantumlSource = text;
          if (codeEl) codeEl.textContent = text;
        } catch (err) {
          console.error('PlantUML encode error:', err);
        }
      }
    } else {
      try {
        const encoded = await encodePlantUml(text);
        const url = getImageUrl(encoded);
        const block = document.createElement('div');
        block.className = BLOCK_CLASSES.PLANTUML;
        block.dataset.plantumlSource = text;
        block.setAttribute('contenteditable', 'false');
        const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        block.innerHTML = `<img src="${url.replace(/"/g, '&quot;')}" alt="PlantUML diagram"><pre class="editor__plantuml-source"><code>${escaped}</code></pre>`;

        const p = document.createElement('p');
        p.innerHTML = '<br>';

        const contentEl = editor.contentElement;
        const sel = window.getSelection();
        let insertBefore = null;
        let replaceBlock = null;

        if (sel?.rangeCount) {
          const range = sel.getRangeAt(0);
          let node = range.startContainer;
          if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
          if (node && contentEl.contains(node)) {
            let current = node;
            while (current && current !== contentEl) {
              if (['P', 'DIV', 'H1', 'H2', 'H3'].includes(current.tagName) ||
                  current.classList?.contains(BLOCK_CLASSES.PLANTUML) ||
                  current.classList?.contains(BLOCK_CLASSES.MATH) ||
                  current.classList?.contains(BLOCK_CLASSES.CODE)) {
                const isEmpty = current.tagName === 'P' && (!current.textContent?.trim() || current.innerHTML === '<br>');
                if (isEmpty) replaceBlock = current;
                else insertBefore = current.nextSibling;
                break;
              }
              current = current.parentElement;
            }
            if (!insertBefore && !replaceBlock) insertBefore = node.nextElementSibling ?? node.nextSibling;
          }
        }

        if (replaceBlock) {
          replaceBlock.replaceWith(block, p);
        } else if (insertBefore) {
          contentEl.insertBefore(block, insertBefore);
          contentEl.insertBefore(p, insertBefore);
        } else {
          contentEl.appendChild(block);
          contentEl.appendChild(p);
        }

        const newRange = document.createRange();
        newRange.setStart(p, 0);
        newRange.collapse(true);
        sel?.removeAllRanges();
        sel?.addRange(newRange);
      } catch (err) {
        console.error('PlantUML insert error:', err);
      }
    }
    editor.focus();
  },

  _showInsertDialog(editor, targetBlock = null, prefillSource = '') {
    const wrap = document.createElement('div');
    wrap.className = 'editor__plantuml-insert';
    wrap.innerHTML = `
      <div class="editor__plantuml-insert__content">
        <div class="editor__plantuml-insert__row">
          <label>PlantUML код
            <textarea class="editor__plantuml-insert__textarea" data-source placeholder="@startuml
Alice -> Bob: Привет!
@enduml" rows="10"></textarea>
          </label>
        </div>
        <div class="editor__plantuml-insert__actions">
          <button type="button" class="editor__plantuml-insert__btn editor__plantuml-insert__btn--primary" data-submit>Вставить</button>
          <button type="button" class="editor__plantuml-insert__btn editor__plantuml-insert__btn--cancel">Отмена</button>
        </div>
      </div>
    `;

    const sourceInp = wrap.querySelector('[data-source]');
    const submitBtn = wrap.querySelector('[data-submit]');

    sourceInp.value = prefillSource || `@startuml
Alice -> Bob: Привет!
@enduml`;

    const overlay = document.createElement('div');
    overlay.className = 'editor__plantuml-insert__overlay';
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

    submitBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const source = sourceInp.value?.trim();
      if (!source) {
        sourceInp.focus();
        return;
      }
      close();
      await this._insertPlantuml(editor, source, targetBlock);
    });

    wrap.querySelector('.editor__plantuml-insert__btn--cancel').addEventListener('click', () => close());

    document.body.appendChild(overlay);
    document.addEventListener('keydown', onKey);
    sourceInp.focus();
  }
};

function showPlantumlContextMenu(editor, block, e) {
  e.preventDefault();

  const sourceEl = block.querySelector('.editor__plantuml-source code');
  const source = block.dataset?.plantumlSource ?? sourceEl?.textContent ?? '';

  const menu = document.createElement('div');
  menu.className = 'editor__table-menu editor__plantuml-menu';
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
      plantumlPlugin._showInsertDialog?.(editor, block, source);
    } else if (btn.dataset.action === 'remove') {
      block.remove();
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
