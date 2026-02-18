/**
 * Плагин: курсив.
 */
export const italicPlugin = {
  id: 'italic',
  group: 'format',
  label: 'Курсив',
  icon: '<i>I</i>',

  action(editor) {
    document.execCommand('italic', false, null);
  },

  isActive(selectionInfo) {
    return selectionInfo.getSurroundingFormat?.().italic ?? false;
  }
};
