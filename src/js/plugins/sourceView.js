/**
 * Плагин: переключение на просмотр исходного Markdown.
 */
export const sourceViewPlugin = {
  id: 'sourceView',
  group: 'view',
  label: 'Исходный текст',

  render(editor) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'editor__button editor__button--source-view';
    btn.title = 'Исходный текст';
    btn.dataset.pluginId = 'sourceView';
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`;

    const updateState = () => {
      const isSource = editor.isSourceView;
      btn.classList.toggle('editor__button--active', isSource);
      btn.title = isSource ? 'Визуальный режим' : 'Исходный текст';
    };

    btn.addEventListener('click', () => {
      editor.toggleSourceView?.();
      updateState();
    });

    editor.onSourceModeChange?.(updateState);

    return btn;
  }
};
