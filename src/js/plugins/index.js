/**
 * Сборка всех плагинов для тулбара.
 * Добавление новой кнопки: создайте файл в plugins/ и добавьте его в массив.
 */
import { boldPlugin } from './bold.js';
import { italicPlugin } from './italic.js';
import { strikethroughPlugin } from './strikethrough.js';
import { linkPlugin } from './link.js';
import { imagePlugin } from './image.js';
import { formulaPlugin } from './formula.js';
import { codePlugin } from './code.js';
import { headingPlugin } from './heading.js';
import { unorderedListPlugin } from './unorderedList.js';
import { orderedListPlugin } from './orderedList.js';
import { tablePlugin } from './table.js';
import { plantumlPlugin } from './plantuml.js';
import { sourceViewPlugin } from './sourceView.js';

export const defaultPlugins = [
  boldPlugin,
  italicPlugin,
  strikethroughPlugin,
  linkPlugin,
  imagePlugin,
  formulaPlugin,
  codePlugin,
  headingPlugin,
  unorderedListPlugin,
  orderedListPlugin,
  tablePlugin,
  plantumlPlugin,
  sourceViewPlugin
];
