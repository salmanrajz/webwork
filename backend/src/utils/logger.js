/* Simple console-based logger; swap with Winston/Pino if needed */
export const info = (...args) => console.log('[INFO]', ...args);
export const error = (...args) => console.error('[ERROR]', ...args);
