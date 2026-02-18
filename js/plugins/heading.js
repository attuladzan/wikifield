/**
 * Плагин: выбор заголовка (H1–H3, параграф).
 */
export const headingPlugin = {
  id: 'heading',
  group: 'blocks',
  label: 'Заголовок',

  render(editor) {
    const select = document.createElement('select');
    select.className = 'editor__select';
    select.title = 'Стиль абзаца';
    select.dataset.pluginId = 'heading';
    select.innerHTML = `
      <option value="p">Параграф</option>
      <option value="h1">Заголовок 1</option>
      <option value="h2">Заголовок 2</option>
      <option value="h3">Заголовок 3</option>
    `;

    const updateSelection = () => {
      const contentEl = editor.contentElement;
      if (!contentEl) return;
      const sel = window.getSelection();
      if (!sel?.anchorNode) return;
      let node = sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentElement : sel.anchorNode;
      while (node && node !== contentEl) {
        const tag = node.tagName?.toUpperCase();
        if (['H1', 'H2', 'H3', 'P'].includes(tag)) {
          select.value = tag.toLowerCase();
          break;
        }
        node = node.parentElement;
      }
    };

    select.addEventListener('change', () => {
      document.execCommand('formatBlock', false, select.value);
      editor.focus();
    });

    const contentEl = editor.contentElement;
    document.addEventListener('selectionchange', updateSelection);
    contentEl?.addEventListener('keyup', updateSelection);
    contentEl?.addEventListener('mouseup', updateSelection);

    return select;
  }
};
