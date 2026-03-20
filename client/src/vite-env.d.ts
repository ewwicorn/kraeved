/// <reference types="vite/client" />

// ======================
// Типы для Yandex Maps API v3
// ======================

declare global {
  interface Window {
    /** Глобальный объект Yandex Maps после загрузки скрипта */
    ymaps3: typeof import('@yandex/ymaps3-types');
  }
}

// Это нужно, чтобы файл считался модулем TypeScript
export {};