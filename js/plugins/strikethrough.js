/**
 * Плагин: зачёркнутый текст.
 */
export const strikethroughPlugin = {
  id: 'strikethrough',
  group: 'format',
  label: 'Зачёркнутый',
  icon: '<s>S</s>',

  action(editor) {
    document.execCommand('strikeThrough', false, null);
  },

  isActive(selectionInfo) {
    return selectionInfo.getSurroundingFormat?.().strikethrough ?? false;
  }
};
