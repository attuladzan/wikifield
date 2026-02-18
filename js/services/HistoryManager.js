/**
 * Менеджер истории для Undo/Redo.
 * Хранит состояния в виде строк (markdown), ограничивает размер стека.
 */
const DEFAULT_MAX_SIZE = 50;

export class HistoryManager {
  #undoStack = [];
  #redoStack = [];
  #maxSize;

  constructor(maxSize = DEFAULT_MAX_SIZE) {
    this.#maxSize = maxSize;
  }

  /**
   * Добавляет состояние в историю.
   * @param {string} state — текущее состояние
   * @param {boolean} replaceLast — заменить последнее (если дубликат)
   */
  push(state, replaceLast = false) {
    if (replaceLast && this.#undoStack[this.#undoStack.length - 1] === state) {
      return;
    }
    this.#undoStack.push(state);
    if (this.#undoStack.length > this.#maxSize) {
      this.#undoStack.shift();
    }
    this.#redoStack = [];
  }

  /**
   * Выполняет undo.
   * @param {string} current — текущее состояние (для записи в redo)
   * @returns {{ done: boolean, target: string|null }}
   */
  undo(current) {
    this.#pushPending(current);

    if (this.#undoStack.length < 1) {
      return { done: false, target: null };
    }

    let target;
    if (this.#undoStack[this.#undoStack.length - 1] === current) {
      this.#undoStack.pop();
      if (this.#undoStack.length < 1) {
        return { done: false, target: null };
      }
      target = this.#undoStack[this.#undoStack.length - 1];
    } else {
      target = this.#undoStack[this.#undoStack.length - 1];
    }

    this.#redoStack.push(current);
    return { done: true, target };
  }

  /**
   * Выполняет redo.
   * @param {string} current — текущее состояние (для записи в undo)
   * @returns {{ done: boolean, target: string|null }}
   */
  redo(current) {
    if (this.#redoStack.length === 0) {
      return { done: false, target: null };
    }

    const target = this.#redoStack.pop();
    this.#undoStack.push(current);
    return { done: true, target };
  }

  /**
   * Сохраняет pending-состояние перед undo (если ещё не в стеке).
   */
  #pushPending(current) {
    if (this.#undoStack[this.#undoStack.length - 1] !== current) {
      this.#undoStack.push(current);
      if (this.#undoStack.length > this.#maxSize) {
        this.#undoStack.shift();
      }
      this.#redoStack = [];
    }
  }

  /**
   * Регистрирует замену контента (при setMarkdown).
   * Не добавляет пустое состояние как предыдущее.
   */
  onReplace(oldState, newState) {
    if (oldState.trim()) {
      this.#undoStack.push(oldState);
      if (this.#undoStack.length > this.#maxSize) {
        this.#undoStack.shift();
      }
    }
    this.#redoStack = [];
    if (this.#undoStack[this.#undoStack.length - 1] !== newState) {
      this.#undoStack.push(newState);
      if (this.#undoStack.length > this.#maxSize) {
        this.#undoStack.shift();
      }
    }
  }

  /** Сброс истории (например, при загрузке нового документа) */
  reset() {
    this.#undoStack = [];
    this.#redoStack = [];
  }
}
