/**
 * Конфигурация загрузки изображений.
 *
 * Измените значения под свой API и переопределите при инициализации:
 *   import { imagePlugin, IMAGE_UPLOAD_CONFIG } from './plugins/image.js';
 *   IMAGE_UPLOAD_CONFIG.apiUrl = 'https://api.example.com/upload';
 *   IMAGE_UPLOAD_CONFIG.responseUrlPath = 'data.url';
 *   IMAGE_UPLOAD_CONFIG.headers = { Authorization: 'Bearer ...' };
 *
 * --- Требования к API ---
 *
 * Метод: POST
 * Content-Type: multipart/form-data
 * Тело: поле с именем fileFieldName, значение — файл изображения
 *
 * --- Пример ответа сервера ---
 *
 * Вариант 1 (плоский):
 *   { "url": "https://cdn.example.com/abc.jpg" }
 *   responseUrlPath: "url"
 *
 * Вариант 2 (вложенный):
 *   { "data": { "url": "https://..." } }
 *   responseUrlPath: "data.url"
 *
 * Вариант 3:
 *   { "result": { "fileUrl": "https://..." } }
 *   responseUrlPath: "result.fileUrl"
 */
export const IMAGE_UPLOAD_CONFIG = {
  /** Включить вкладку «Загрузить». По умолчанию выключено — только вставка по ссылке */
  enabled: false,
  /** URL API (POST multipart/form-data). Обязателен при enabled: true */
  apiUrl: '',
  /** Имя поля с файлом */
  fileFieldName: 'file',
  /** Путь к URL в JSON. Примеры: "url", "data.url", "result.fileUrl" */
  responseUrlPath: 'url',
  /** Доп. заголовки, напр. { Authorization: 'Bearer ...' } */
  headers: {}
};
