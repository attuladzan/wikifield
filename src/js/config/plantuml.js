/**
 * Конфигурация PlantUML диаграмм.
 *
 * Официальный сервер PlantUML: https://www.plantuml.com/plantuml
 * Формат URL: {serverUrl}/{format}/{encoded}
 *
 * Для продакшена можно использовать собственный proxy-сервер:
 *   PLANTUML_CONFIG.serverUrl = 'https://your-proxy.com/plantuml';
 * или
 *   PLANTUML_CONFIG.proxyUrl = 'https://your-proxy.com/plantuml';
 *
 * Proxy должен проксировать запросы к PlantUML или иметь тот же API:
 *   GET /png/{encoded}  -> PNG изображение
 *   GET /svg/{encoded}  -> SVG изображение
 */
export const PLANTUML_CONFIG = {
  /**
   * Базовый URL сервера PlantUML.
   * Демо: официальный сервер plantuml.com
   */
  serverUrl: 'https://www.plantuml.com/plantuml',

  /**
   * Опциональный proxy URL. Если задан, используется вместо serverUrl.
   * Полезно для обхода CORS или использования корпоративного сервера.
   * @example 'https://proxy.example.com/plantuml'
   */
  proxyUrl: null,

  /**
   * Формат вывода: 'png' | 'svg'
   */
  format: 'png',

  /** Получить базовый URL (serverUrl или proxyUrl) */
  getBaseUrl() {
    return this.proxyUrl || this.serverUrl;
  }
};
