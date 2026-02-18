/**
 * Плагин: жирный текст.
 */
export const boldPlugin = {
  id: 'bold',
  group: 'format',
  label: 'Жирный',
  icon: '<b>B</b>',

  action(editor) {
    document.execCommand('bold', false, null);
  },

  isActive(selectionInfo) {
    return selectionInfo.getSurroundingFormat?.().bold ?? false;
  }
};
