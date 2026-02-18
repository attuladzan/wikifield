/**
 * Главный класс редактора.
 * Координирует работу тулбара, области контента и обработчиков markdown.
 */
import { Toolbar } from './Toolbar.js';
import { ContentArea } from './ContentArea.js';
import { MarkdownHandlerRegistry } from '../handlers/MarkdownHandlerRegistry.js';

export class Editor {
  #container = null;
  #toolbar = null;
  #contentArea = null;
  #handlerRegistry = null;
  #sourceView = false;
  #contentWrap = null;
  #sourceEl = null;
  #sourceModeListeners = [];

  constructor(container, options = {}) {
    this.#container = typeof container === 'string' ? document.querySelector(container) : container;
    if (!this.#container) throw new Error('Editor: container not found');

    this.#handlerRegistry = options.handlers ?? new MarkdownHandlerRegistry();
    this.#buildDOM();
    this.#toolbar = new Toolbar(this.#container.querySelector('.editor__toolbar'), {
      editor: this,
      plugins: options.plugins ?? []
    });
    this.#contentArea = new ContentArea(this.#container.querySelector('.editor__content'), {
      handlerRegistry: this.#handlerRegistry,
      editor: this
    });

    this.#connectToolbarToContent();
    this.#contentArea.setToolbar(this.#toolbar);
    this.#setupHotkeys();
  }

  #setupHotkeys() {
    const win = this.#container.ownerDocument?.defaultView || window;
    win.__wikifieldHotkey = (action) => {
      if (this.#sourceView) return;
      this.#contentArea.handleHotkey(null, action);
    };
    win.addEventListener('wikifield-hotkey', (e) => {
      const action = e.detail?.action;
      if (action && !this.#sourceView) {
        this.#contentArea.handleHotkey(null, action);
      }
    });
  }

  #buildDOM() {
    this.#container.innerHTML = `
      <div class="editor">
        <div class="editor__toolbar"></div>
        <div class="editor__body">
          <div class="editor__content-wrap">
            <div class="editor__content" contenteditable="true"></div>
          </div>
          <textarea class="editor__source" spellcheck="false" placeholder="Markdown..."></textarea>
        </div>
      </div>
    `;
    this.#contentWrap = this.#container.querySelector('.editor__content-wrap');
    this.#sourceEl = this.#container.querySelector('.editor__source');
  }

  #connectToolbarToContent() {
    this.#toolbar.on('action', (pluginId, plugin) => {
      this.#contentArea.executeAction(pluginId, plugin);
    });
  }

  /** Возвращает содержимое в формате Markdown */
  getMarkdown() {
    return this.#contentArea.getMarkdown();
  }

  /** Устанавливает содержимое из Markdown */
  setMarkdown(markdown) {
    this.#contentArea.setMarkdown(markdown);
  }

  /** Регистрирует обработчик markdown */
  registerHandler(handler) {
    this.#handlerRegistry.register(handler);
  }

  /** Добавляет плагин в тулбар */
  addPlugin(plugin) {
    this.#toolbar.addPlugin(plugin);
  }

  /** Фокус на редакторе */
  focus() {
    this.#contentArea.focus();
  }

  /** Элемент области контента (для плагинов) */
  get contentElement() {
    return this.#contentArea?.element ?? this.#container?.querySelector('.editor__content');
  }

  /** Включён ли режим просмотра исходника */
  get isSourceView() {
    return this.#sourceView;
  }

  /** Переключает режим визуальный / исходный текст */
  toggleSourceView() {
    this.#sourceView = !this.#sourceView;
    if (this.#sourceView) {
      this.#sourceEl.value = this.getMarkdown();
      this.#contentWrap.classList.add('editor__content-wrap--hidden');
      this.#sourceEl.classList.add('editor__source--visible');
      this.#sourceEl.focus();
      this.#toolbar.setSourceMode?.(true);
    } else {
      this.setMarkdown(this.#sourceEl.value);
      this.#contentWrap.classList.remove('editor__content-wrap--hidden');
      this.#sourceEl.classList.remove('editor__source--visible');
      this.#contentArea.focus();
      this.#toolbar.setSourceMode?.(false);
    }
    this.#sourceModeListeners.forEach((cb) => cb());
  }

  /** Подписка на смену режима исходник/визуальный */
  onSourceModeChange(callback) {
    if (typeof callback === 'function') {
      this.#sourceModeListeners.push(callback);
    }
  }
}
