/**
 * CSS-классы специальных блоков редактора.
 * Используется для единообразной проверки «блоковых» элементов (code, formula, plantuml и т.д.).
 */
export const BLOCK_CLASSES = {
  CODE: 'editor__code-block',
  MATH: 'editor__math-block',
  PLANTUML: 'editor__plantuml-block'
};

/** Список классов для проверки «специального» блока (Enter внутри блока) */
export const SPECIAL_BLOCK_CLASSES = [
  BLOCK_CLASSES.CODE,
  BLOCK_CLASSES.MATH,
  BLOCK_CLASSES.PLANTUML
];
