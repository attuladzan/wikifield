/**
 * Управление тулбаром редактора.
 * Поддерживает простую регистрацию плагинов-кнопок.
 */
import { escapeHtml } from '../utils/html.js';

export class Toolbar {
  #container = null;
  #editor = null;
  #plugins = new Map();
  #listeners = { action: [] };

  constructor(container, options = {}) {
    this.#container = typeof container === 'string' ? document.querySelector(container) : container;
    this.#editor = options.editor;

    if (!this.#container) throw new Error('Toolbar: container not found');

    const plugins = options.plugins ?? [];
    plugins.forEach(plugin => this.addPlugin(plugin));
    plugins.forEach(plugin => plugin.init?.(this.#editor));
  }

  /**
   * Регистрирует плагин. Плагин — объект с полями:
   * - id: string — уникальный идентификатор
   * - group?: string — группа кнопок (для разделителя)
   * - label?: string — подсказка
   * - icon?: string — HTML или текст для кнопки
   * - render?: (container) => HTMLElement — кастомный рендер (select, dropdown)
   * - action?: (editor) => void — действие при клике (если render не задан)
   */
  addPlugin(plugin) {
    if (!plugin?.id) throw new Error('Toolbar plugin must have id');
    if (this.#plugins.has(plugin.id)) {
      console.warn(`Toolbar: plugin "${plugin.id}" already registered, replacing`);
    }
    this.#plugins.set(plugin.id, plugin);
    this.#renderPlugin(plugin);
  }

  #renderPlugin(plugin) {
    const groupKey = plugin.group ?? 'default';
    let groupEl = this.#container.querySelector(`[data-group="${groupKey}"]`);

    if (!groupEl) {
      groupEl = document.createElement('div');
      groupEl.className = 'editor__toolbar-group';
      groupEl.dataset.group = groupKey;
      this.#container.appendChild(groupEl);
    }

    if (plugin.render) {
      const el = plugin.render(this.#editor);
      if (el) groupEl.appendChild(el);
      return;
    }

    const button = document.createElement('button');
    button.type = 'button';
    button.className = `editor__button editor__button--${plugin.id}`;
    button.title = plugin.label ?? plugin.id;
    button.dataset.pluginId = plugin.id;

    if (plugin.icon) {
      button.innerHTML = typeof plugin.icon === 'string' && plugin.icon.startsWith('<')
        ? plugin.icon
        : escapeHtml(plugin.icon);
    } else {
      button.textContent = plugin.label ?? plugin.id;
    }

    button.addEventListener('click', () => {
      this.#emit('action', plugin.id, plugin);
    });

    groupEl.appendChild(button);
  }

  on(event, callback) {
    if (this.#listeners[event]) this.#listeners[event].push(callback);
  }

  #emit(event, ...args) {
    (this.#listeners[event] ?? []).forEach(cb => cb(...args));
  }

  /** Возвращает плагин по id */
  getPlugin(pluginId) {
    return this.#plugins.get(pluginId) ?? null;
  }

  /** Обновляет состояние кнопки (active/inactive) */
  setButtonState(pluginId, active) {
    const btn = this.#container.querySelector(`[data-plugin-id="${pluginId}"]`);
    if (btn) btn.classList.toggle('editor__button--active', active);
  }

  /** Обновляет состояние всех кнопок на основе текущего выделения */
  updateButtonStates(selectionInfo) {
    this.#plugins.forEach((plugin, id) => {
      if (typeof plugin.isActive === 'function') {
        this.setButtonState(id, plugin.isActive(selectionInfo));
      }
    });
  }

  /** Режим исходника: скрыть/отключить кнопки форматирования */
  setSourceMode(isSource) {
    const formatGroups = this.#container.querySelectorAll('[data-group="format"], [data-group="blocks"]');
    formatGroups.forEach(group => {
      group.classList.toggle('editor__toolbar-group--disabled', isSource);
    });
  }
}
