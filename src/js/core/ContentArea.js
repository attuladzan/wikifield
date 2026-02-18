/**
 * Область контента редактора (contenteditable).
 * Отвечает за отображение, выделение и выполнение действий форматирования.
 */
import { DomToMarkdown } from '../converters/DomToMarkdown.js';
import { MarkdownToDom } from '../converters/MarkdownToDom.js';
import { SPECIAL_BLOCK_CLASSES } from '../constants/blockClasses.js';
import { HistoryManager } from '../services/HistoryManager.js';

const INPUT_DEBOUNCE_MS = 150;

export class ContentArea {
  #el = null;
  #handlerRegistry = null;
  #toolbar = null;
  #editor = null;
  #actionHandlers = new Map();
  #history = new HistoryManager();
  #inputDebounce = null;
  #isRestoring = false;

  constructor(container, options = {}) {
    this.#el = typeof container === 'string' ? document.querySelector(container) : container;
    this.#handlerRegistry = options.handlerRegistry;
    this.#editor = options.editor;

    if (!this.#el) throw new Error('ContentArea: container not found');

    this.#el.addEventListener('input', () => this._onInput());
    this.#el.addEventListener('keyup', () => this._onSelectionChange());
    this.#el.addEventListener('mouseup', () => this._onSelectionChange());
    this.#el.addEventListener('keydown', (e) => this._onKeyDown(e));
    this.#el.addEventListener('mousedown', (e) => this._onMouseDown(e));
  }

  /** Обработка горячих клавиш (вызывается из Editor). */
  handleHotkey(_e, action) {
    this.focus();
    if (action === 'undo') {
      this.#performUndo();
    } else if (action === 'redo') {
      this.#performRedo();
    } else {
      const plugin = this.#toolbar?.getPlugin?.(action) ?? null;
      this.executeAction(action, plugin);
    }
    this._onSelectionChange();
  }

  _handleBackspaceDelete(e) {
    const sel = window.getSelection();
    if (!sel?.rangeCount || !sel.isCollapsed) return;

    const range = sel.getRangeAt(0);
    const isSpecialBlock = (el) =>
      el && el.nodeType === Node.ELEMENT_NODE &&
      SPECIAL_BLOCK_CLASSES.some((c) => el.classList?.contains(c));

    /** Блокируем только удаление специальных блоков — удаляем строго по одному */
    if (e.key === 'Backspace') {
      if (!this.#isCursorAtBlockStart(range)) return;
      const blockBefore = this.#getBlockBeforeCursor(range);
      if (blockBefore && isSpecialBlock(blockBefore)) {
        e.preventDefault();
        this.#deleteBlockAndMoveCursor(blockBefore, true);
      }
    } else if (e.key === 'Delete') {
      const blockAfter = this.#getBlockAfterCursor(range);
      if (blockAfter && isSpecialBlock(blockAfter)) {
        e.preventDefault();
        this.#deleteBlockAndMoveCursor(blockAfter, false);
      }
    }
  }

  #getBlockBeforeCursor(range) {
    const block = this.#getCursorBlock(range);
    return block?.previousElementSibling ?? null;
  }

  #getBlockAfterCursor(range) {
    const block = this.#getCursorBlock(range);
    if (block) return block.nextElementSibling;
    if (range.startContainer === this.#el) {
      return this.#el.children[range.startOffset] ?? null;
    }
    return null;
  }

  #isCursorAtBlockStart(range) {
    const block = this.#getCursorBlock(range);
    if (!block) return false;
    const testRange = document.createRange();
    testRange.setStart(block, 0);
    testRange.collapse(true);
    return range.compareBoundaryPoints(Range.START_TO_START, testRange) === 0;
  }

  #getCursorBlock(range) {
    let node = range.startContainer;
    if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
    if (!node || !this.#el.contains(node)) return null;

    const blockTags = ['P', 'DIV', 'H1', 'H2', 'H3', 'LI', 'PRE', 'TABLE'];
    let block = node;
    while (block && block !== this.#el) {
      if (blockTags.includes(block.tagName)) return block;
      block = block.parentElement;
    }
    return null;
  }

  #deleteBlockAndMoveCursor(block, isBackspace) {
    if (!block || !this.#el.contains(block)) return;

    const nextBlock = block.nextElementSibling;
    const prevBlock = block.previousElementSibling;

    block.remove();

    const isSpecialBlock = (el) =>
      el && el.nodeType === Node.ELEMENT_NODE &&
      SPECIAL_BLOCK_CLASSES.some((c) => el.classList?.contains(c));

    let targetNode = null;
    let targetOffset = 0;

    if (isBackspace) {
      if (prevBlock) {
        if (prevBlock.tagName === 'P' && (!prevBlock.textContent?.trim() || prevBlock.innerHTML === '<br>')) {
          targetNode = prevBlock.firstChild ?? prevBlock;
          targetOffset = 0;
        } else {
          const last = prevBlock.lastChild;
          if (last) {
            targetNode = last.nodeType === Node.TEXT_NODE ? last : prevBlock;
            targetOffset = last.nodeType === Node.TEXT_NODE ? last.length : prevBlock.childNodes.length;
          } else {
            targetNode = prevBlock;
            targetOffset = 0;
          }
        }
      } else if (nextBlock) {
        if (isSpecialBlock(nextBlock)) {
          const p = document.createElement('p');
          p.innerHTML = '<br>';
          this.#el.insertBefore(p, nextBlock);
          targetNode = p.firstChild ?? p;
          targetOffset = 0;
        } else {
          targetNode = nextBlock.firstChild ?? nextBlock;
          targetOffset = 0;
        }
      }
    } else {
      if (nextBlock) {
        if (isSpecialBlock(nextBlock)) {
          const p = document.createElement('p');
          p.innerHTML = '<br>';
          this.#el.insertBefore(p, nextBlock);
          targetNode = p.firstChild ?? p;
          targetOffset = 0;
        } else {
          targetNode = nextBlock.firstChild ?? nextBlock;
          targetOffset = 0;
        }
      } else if (prevBlock) {
        const last = prevBlock.lastChild;
        targetNode = last?.nodeType === Node.TEXT_NODE ? last : prevBlock;
        targetOffset = last?.nodeType === Node.TEXT_NODE ? last.length : (prevBlock.childNodes?.length ?? 0);
      }
    }

    if (targetNode) {
      const newRange = document.createRange();
      if (targetNode.nodeType === Node.TEXT_NODE) {
        newRange.setStart(targetNode, Math.min(targetOffset, targetNode.length));
      } else {
        newRange.setStart(targetNode, Math.min(targetOffset, targetNode.childNodes?.length ?? 0));
      }
      newRange.collapse(true);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(newRange);
    }
    this.#el.focus();
  }

  _onMouseDown(e) {
    const target = e.target;
    if (target !== this.#el) return;

    const { clientY } = e;
    const children = Array.from(this.#el.children).filter(
      n => n.nodeType === Node.ELEMENT_NODE && n.tagName !== 'BR'
    );
    let insertBefore = null;
    for (const child of children) {
      const rect = child.getBoundingClientRect();
      if (clientY < rect.bottom) {
        insertBefore = child;
        break;
      }
    }

    const p = document.createElement('p');
    p.innerHTML = '<br>';
    this.#el.insertBefore(p, insertBefore);

    requestAnimationFrame(() => {
      const range = document.createRange();
      range.setStart(p, 0);
      range.collapse(true);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      this.#el.focus();
    });

    e.preventDefault();
  }

  _onKeyDown(e) {
    if (e.key === 'Backspace' || e.key === 'Delete') {
      this._handleBackspaceDelete(e);
      return;
    }
    if (e.key !== 'Enter') return;

    const sel = window.getSelection();
    if (!sel?.rangeCount) return;

    const range = sel.getRangeAt(0);
    const isSpecialBlock = (el) =>
      el && SPECIAL_BLOCK_CLASSES.some((c) => el.classList?.contains(c));

    let node = range.startContainer;
    if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
    if (!node) return;

    let insertAfter = null;

    if (node === this.#el) {
      const idx = Math.max(0, range.startOffset - 1);
      const prevChild = node.childNodes[idx] ?? node.lastChild;
      if (prevChild && isSpecialBlock(prevChild)) insertAfter = prevChild;
    } else if (isSpecialBlock(node)) {
      insertAfter = node;
    } else {
      let block = node;
      while (block && block !== this.#el && !['DIV', 'P', 'LI', 'H1', 'H2', 'H3', 'PRE'].includes(block?.tagName)) {
        block = block.parentElement;
      }
      if (block && isSpecialBlock(block.previousElementSibling)) insertAfter = block.previousElementSibling;
    }

    if (insertAfter) {
      e.preventDefault();
      const p = document.createElement('p');
      p.innerHTML = '<br>';
      insertAfter.parentNode?.insertBefore(p, insertAfter.nextSibling);

      requestAnimationFrame(() => {
        const newRange = document.createRange();
        const target = p.firstChild || p;
        newRange.setStart(target, 0);
        newRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newRange);
        this.#el.focus();
      });
    }
  }

  /** Связь с тулбаром для обновления состояния кнопок */
  setToolbar(toolbar) {
    this.#toolbar = toolbar;
  }

  _onInput() {
    if (!this.#isRestoring) this.#scheduleHistoryPush();
  }

  #scheduleHistoryPush() {
    clearTimeout(this.#inputDebounce);
    this.#inputDebounce = setTimeout(() => {
      const md = this.getMarkdown();
      this.#history.push(md, true);
    }, INPUT_DEBOUNCE_MS);
  }

  #performUndo() {
    clearTimeout(this.#inputDebounce);
    this.#inputDebounce = null;

    const current = this.getMarkdown();
    const { done, target } = this.#history.undo(current);
    if (!done || !target) return;

    this.#isRestoring = true;
    this.setMarkdown(target);
    this.#isRestoring = false;
  }

  #performRedo() {
    const current = this.getMarkdown();
    const { done, target } = this.#history.redo(current);
    if (!done || !target) return;

    this.#isRestoring = true;
    this.setMarkdown(target);
    this.#isRestoring = false;
  }

  _onSelectionChange() {
    this.#toolbar?.updateButtonStates?.(this.getSelectionInfo());
  }

  /** Регистрирует кастомный обработчик действия по pluginId (для расширения) */
  registerActionHandler(pluginId, handler) {
    this.#actionHandlers.set(pluginId, handler);
  }

  /**
   * Выполняет действие плагина. Единая точка диспетчеризации:
   * 1) зарегистрированный handler, 2) стандартные execCommand, 3) plugin.action(editor)
   */
  executeAction(pluginId, plugin) {
    const handler = this.#actionHandlers.get(pluginId);
    if (handler) {
      handler(this);
      this.focus();
      return;
    }
    if (this.#hasDefaultCommand(pluginId)) {
      this.#executeDefaultAction(pluginId);
      return;
    }
    if (plugin?.action && this.#editor) {
      plugin.action(this.#editor);
    }
  }

  #hasDefaultCommand(pluginId) {
    const defaultIds = [
      'bold', 'italic', 'strikethrough', 'h1', 'h2', 'h3', 'paragraph',
      'unorderedList', 'orderedList'
    ];
    return defaultIds.includes(pluginId);
  }

  #executeDefaultAction(pluginId) {
    const commands = {
      bold: 'bold',
      italic: 'italic',
      strikethrough: 'strikeThrough',
      h1: () => this.#formatBlock('h1'),
      h2: () => this.#formatBlock('h2'),
      h3: () => this.#formatBlock('h3'),
      paragraph: () => this.#formatBlock('p'),
      unorderedList: 'insertUnorderedList',
      orderedList: 'insertOrderedList'
    };

    const cmd = commands[pluginId];
    if (typeof cmd === 'function') {
      cmd();
    } else if (cmd) {
      document.execCommand(cmd, false, null);
    }
    this.focus();
  }

  #formatBlock(tagName) {
    document.execCommand('formatBlock', false, tagName);
  }

  /** Информация о текущем выделении (для isActive плагинов) */
  getSelectionInfo() {
    const sel = window.getSelection();
    return {
      anchorNode: sel?.anchorNode,
      focusNode: sel?.focusNode,
      range: sel?.rangeCount ? sel.getRangeAt(0) : null,
      isEmpty: sel?.isCollapsed ?? true,
      getSurroundingFormat: () => this.#getSurroundingFormat(sel)
    };
  }

  /** Получает текущий формат вокруг выделения */
  #getSurroundingFormat(sel) {
    if (!sel?.rangeCount) return {};
    const range = sel.getRangeAt(0);
    const format = {};
    const tags = {
      bold: ['B', 'STRONG'],
      italic: ['I', 'EM'],
      strikethrough: ['S', 'STRIKE'],
      link: ['A'],
      unorderedList: ['UL'],
      orderedList: ['OL']
    };
    try {
      const container = range.commonAncestorContainer;
      let node = container.nodeType === 3 ? container.parentElement : container;
      while (node && node !== this.#el) {
        const tag = node.tagName?.toUpperCase();
        for (const [key, list] of Object.entries(tags)) {
          if (list.includes(tag)) format[key] = true;
        }
        if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(tag)) {
          format.heading = tag.toLowerCase();
        }
        node = node.parentElement;
      }
    } catch (_) {}
    return format;
  }

  /** Возвращает markdown из текущего DOM */
  getMarkdown() {
    return DomToMarkdown.convert(this.#el, this.#handlerRegistry);
  }

  /** Устанавливает содержимое из markdown */
  setMarkdown(markdown) {
    if (!this.#isRestoring) {
      this.#history.onReplace(this.getMarkdown(), markdown);
    }
    const html = MarkdownToDom.convert(markdown, this.#handlerRegistry);
    this.#el.innerHTML = html;
  }

  focus() {
    this.#el.focus();
  }

  get element() {
    return this.#el;
  }
}
