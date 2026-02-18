/**
 * Плагин: вставка ссылки.
 * Диалог с полем URL и опциональным плейсхолдером (текст ссылки).
 * Контекстное меню для редактирования и удаления ссылки.
 */
export const linkPlugin = {
  id: 'link',
  group: 'format',
  label: 'Ссылка',
  icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,

  action(editor) {
    const sel = window.getSelection();
    const hasSelection = sel && sel.rangeCount > 0 && !sel.isCollapsed;
    const prefillText = hasSelection ? sel.toString().trim() : '';
    if (this._showInsertDialog) {
      this._showInsertDialog(editor, prefillText);
    } else {
      this._insertLink(editor, prompt('URL:') || '', prefillText || null);
    }
  },

  init(editor) {
    const el = editor.contentElement;
    if (!el) return;

    const handler = (e) => {
      const a = e.target.closest('a[href]');
      if (a) showLinkContextMenu(editor, a, e);
    };

    el.addEventListener('contextmenu', handler);
    this._teardown = () => el.removeEventListener('contextmenu', handler);
  },

  destroy() {
    this._teardown?.();
  },

  _insertLink(editor, url, placeholder, targetLink = null) {
    if (!url || !url.trim()) return;

    const href = url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`;
    const text = placeholder?.trim() || href;
    const escapedHref = href.replace(/"/g, '&quot;');
    const escapedText = text.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    if (targetLink) {
      targetLink.href = href;
      targetLink.textContent = text;
    } else {
      const sel = window.getSelection();
      const hasSelection = sel && sel.rangeCount > 0 && !sel.isCollapsed;
      if (hasSelection) {
        document.execCommand('createLink', false, href);
        const range = sel.getRangeAt(0);
        const link = range.commonAncestorContainer.nodeType === 3
          ? range.commonAncestorContainer.parentElement
          : range.commonAncestorContainer;
        if (link?.tagName === 'A' && text !== href) link.textContent = text;
      } else {
        document.execCommand('insertHTML', false, `<a href="${escapedHref}">${escapedText}</a>`);
      }
    }
    editor.focus();
  },

  _showInsertDialog(editor, prefillText, targetLink = null, prefillUrl = '') {
    const sel = window.getSelection();
    const savedRange = sel?.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
    const contentEl = editor.contentElement;
    const inContent = contentEl && savedRange && contentEl.contains(savedRange.commonAncestorContainer);

    const wrap = document.createElement('div');
    wrap.className = 'editor__link-insert';
    wrap.innerHTML = `
      <div class="editor__link-insert__content">
        <div class="editor__link-insert__row">
          <label>URL <input type="url" class="editor__link-insert__input" data-url placeholder="https://..."></label>
        </div>
        <div class="editor__link-insert__row">
          <label>Текст ссылки (необязательно) <input type="text" class="editor__link-insert__input" data-placeholder placeholder="Оставьте пустым, чтобы использовать URL"></label>
        </div>
        <div class="editor__link-insert__actions">
          <button type="button" class="editor__link-insert__btn editor__link-insert__btn--primary">Вставить</button>
          <button type="button" class="editor__link-insert__btn editor__link-insert__btn--cancel">Отмена</button>
        </div>
      </div>
    `;

    const urlInp = wrap.querySelector('[data-url]');
    const placeholderInp = wrap.querySelector('[data-placeholder]');
    if (prefillText) placeholderInp.value = prefillText;
    if (prefillUrl) urlInp.value = prefillUrl;

    const overlay = document.createElement('div');
    overlay.className = 'editor__link-insert__overlay';
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

    wrap.querySelector('.editor__link-insert__btn--primary').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const url = urlInp.value?.trim();
      if (!url) {
        urlInp.focus();
        return;
      }
      const placeholder = placeholderInp.value?.trim() || null;
      close();
      if (!targetLink && savedRange && inContent) {
        const s = window.getSelection();
        s.removeAllRanges();
        s.addRange(savedRange);
      }
      this._insertLink(editor, url, placeholder, targetLink);
    });

    wrap.querySelector('.editor__link-insert__btn--cancel').addEventListener('click', () => close());

    document.body.appendChild(overlay);
    document.addEventListener('keydown', onKey);
    urlInp.focus();
  }
};

function showLinkContextMenu(editor, link, e) {
  e.preventDefault();

  const menu = document.createElement('div');
  menu.className = 'editor__table-menu editor__link-menu';
  menu.innerHTML = `
    <button type="button" data-action="edit">Изменить ссылку</button>
    <button type="button" data-action="remove">Удалить ссылку</button>
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
      const url = link.getAttribute('href') || '';
      const text = link.textContent.trim();
      close();
      linkPlugin._showInsertDialog?.(editor, text, link, url);
    } else if (btn.dataset.action === 'remove') {
      const parent = link.parentNode;
      while (link.firstChild) parent.insertBefore(link.firstChild, link);
      parent.removeChild(link);
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
