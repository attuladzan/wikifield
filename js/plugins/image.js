/**
 * Плагин: вставка изображений.
 * Два режима: по ссылке или загрузка с компьютера.
 *
 * Конфиг загрузки — см. js/config/imageUpload.js
 */
import { IMAGE_UPLOAD_CONFIG as DEFAULT_UPLOAD_CONFIG } from '../config/imageUpload.js';

export const IMAGE_UPLOAD_CONFIG = DEFAULT_UPLOAD_CONFIG;
const getNestedValue = (obj, path) => path.split('.').reduce((o, k) => o?.[k], obj);

const IMAGE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;

export const imagePlugin = {
  id: 'image',
  group: 'blocks',
  label: 'Изображение',
  icon: IMAGE_ICON,
  uploadConfig: IMAGE_UPLOAD_CONFIG,

  action(editor) {
    this._showInsertDialog?.(editor);
  },

  init(editor) {
    const el = editor.contentElement;
    if (!el) return;

    const handler = (e) => {
      const img = e.target.closest('img.editor__image');
      if (img) showImageContextMenu(editor, img, e);
    };

    el.addEventListener('contextmenu', handler);
    this._teardown = () => el.removeEventListener('contextmenu', handler);
  },

  destroy() {
    this._teardown?.();
  },

  _insertImage(editor, src, alt = '', targetImg = null) {
    if (!src?.trim()) return;

    const escapedSrc = src.trim().replace(/"/g, '&quot;');
    const escapedAlt = (alt || '').replace(/"/g, '&quot;');

    if (targetImg) {
      targetImg.src = src.trim();
      targetImg.alt = escapedAlt;
    } else {
      const html = `<img class="editor__image" src="${escapedSrc}" alt="${escapedAlt}">`;
      document.execCommand('insertHTML', false, html);
    }
    editor.focus();
  },

  async _uploadFile(editor, file) {
    const cfg = this.uploadConfig || IMAGE_UPLOAD_CONFIG;
    if (!cfg.enabled || !cfg.apiUrl) {
      throw new Error('Загрузка не настроена. Задайте IMAGE_UPLOAD_CONFIG.apiUrl');
    }

    const formData = new FormData();
    formData.append(cfg.fileFieldName, file);

    const res = await fetch(cfg.apiUrl, {
      method: 'POST',
      headers: cfg.headers,
      body: formData
    });

    if (!res.ok) throw new Error(`Ошибка загрузки: ${res.status}`);
    const json = await res.json();
    const url = getNestedValue(json, cfg.responseUrlPath);
    if (!url) throw new Error(`Сервер не вернул URL. Ожидается по пути: ${cfg.responseUrlPath}`);
    return url;
  },

  _showInsertDialog(editor, targetImg = null, prefillSrc = '', prefillAlt = '') {
    const cfg = this.uploadConfig ?? IMAGE_UPLOAD_CONFIG;
    const uploadAvailable = cfg.enabled && !!cfg.apiUrl?.trim();
    const sel = window.getSelection();
    const savedRange = sel?.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
    const contentEl = editor.contentElement;
    const inContent = contentEl && savedRange && contentEl.contains(savedRange?.commonAncestorContainer);

    const wrap = document.createElement('div');
    wrap.className = 'editor__image-insert';
    wrap.innerHTML = `
      <div class="editor__image-insert__content">
        <div class="editor__image-insert__tabs">
          <button type="button" class="editor__image-insert__tab editor__image-insert__tab--active" data-tab="url">По ссылке</button>
          ${uploadAvailable ? `<button type="button" class="editor__image-insert__tab" data-tab="upload">Загрузить</button>` : ''}
        </div>
        <div class="editor__image-insert__panel editor__image-insert__panel--url" data-panel="url">
          <div class="editor__image-insert__row">
            <label>URL изображения <input type="url" class="editor__image-insert__input" data-src placeholder="https://..."></label>
          </div>
          <div class="editor__image-insert__row">
            <label>Подпись (alt, необязательно) <input type="text" class="editor__image-insert__input" data-alt placeholder="Описание изображения"></label>
          </div>
        </div>
        ${uploadAvailable ? `
        <div class="editor__image-insert__panel editor__image-insert__panel--hidden" data-panel="upload">
          <div class="editor__image-insert__upload">
            <input type="file" accept="image/*" data-file class="editor__image-insert__file">
            <p class="editor__image-insert__hint">Выберите изображение для загрузки</p>
            <div class="editor__image-insert__row" style="margin-top:8px">
              <label>Подпись (alt) <input type="text" class="editor__image-insert__input" data-alt-upload placeholder="Необязательно"></label>
            </div>
          </div>
        </div>
        ` : ''}
        <div class="editor__image-insert__actions">
          <button type="button" class="editor__image-insert__btn editor__image-insert__btn--primary" data-submit>Вставить</button>
          <button type="button" class="editor__image-insert__btn editor__image-insert__btn--cancel">Отмена</button>
        </div>
      </div>
    `;

    const srcInp = wrap.querySelector('[data-src]');
    const altInp = wrap.querySelector('[data-alt]');
    const fileInp = wrap.querySelector('[data-file]');
    const altUploadInp = wrap.querySelector('[data-alt-upload]');
    const submitBtn = wrap.querySelector('[data-submit]');

    if (prefillSrc) srcInp.value = prefillSrc;
    if (prefillAlt) {
      altInp.value = prefillAlt;
      if (altUploadInp) altUploadInp.value = prefillAlt;
    }

    let activeTab = 'url';

    wrap.querySelectorAll('[data-tab]').forEach(tab => {
      tab.addEventListener('click', () => {
        activeTab = tab.dataset.tab;
        wrap.querySelectorAll('[data-tab]').forEach(t => t.classList.remove('editor__image-insert__tab--active'));
        wrap.querySelectorAll('[data-panel]').forEach(p => p.classList.add('editor__image-insert__panel--hidden'));
        tab.classList.add('editor__image-insert__tab--active');
        wrap.querySelector(`[data-panel="${activeTab}"]`)?.classList.remove('editor__image-insert__panel--hidden');
      });
    });

    const overlay = document.createElement('div');
    overlay.className = 'editor__image-insert__overlay';
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

    const doInsert = (src, alt) => {
      close();
      if (!targetImg && savedRange && inContent) {
        const s = window.getSelection();
        s.removeAllRanges();
        s.addRange(savedRange);
      }
      this._insertImage(editor, src, alt, targetImg);
    };

    submitBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (activeTab === 'url') {
        const src = srcInp.value?.trim();
        if (!src) {
          srcInp.focus();
          return;
        }
        doInsert(src, altInp.value?.trim() || '');
      } else if (activeTab === 'upload' && fileInp?.files?.[0]) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Загрузка...';
        try {
          const url = await this._uploadFile(editor, fileInp.files[0]);
          const alt = altUploadInp?.value?.trim() || '';
          doInsert(url, alt);
        } catch (err) {
          alert(err.message || 'Ошибка загрузки');
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Вставить';
        }
      } else {
        fileInp?.click();
      }
    });

    fileInp?.addEventListener('change', () => {
      if (fileInp.files?.[0]) {
        wrap.querySelector('.editor__image-insert__hint').textContent = `Выбрано: ${fileInp.files[0].name}`;
      }
    });

    wrap.querySelector('.editor__image-insert__btn--cancel').addEventListener('click', () => close());

    document.body.appendChild(overlay);
    document.addEventListener('keydown', onKey);
    srcInp?.focus();
  }
};

function showImageContextMenu(editor, img, e) {
  e.preventDefault();

  const menu = document.createElement('div');
  menu.className = 'editor__table-menu editor__image-menu';
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
      const src = img.getAttribute('src') || '';
      const alt = img.getAttribute('alt') || '';
      close();
      imagePlugin._showInsertDialog?.(editor, img, src, alt);
    } else if (btn.dataset.action === 'remove') {
      img.remove();
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
