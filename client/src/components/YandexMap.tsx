import React, { useEffect, useRef, useState, useCallback } from 'react';

interface YandexMapProps {
  center?: [number, number]; // [longitude, latitude]
  zoom?: number;
  height?: string;
  width?: string;
  className?: string;
  onLoad?: () => void;
}

const YandexMap: React.FC<YandexMapProps> = ({
  center = [37.6173, 55.7558], // Москва
  zoom = 12,
  height = '600px',
  width = '100%',
  className = '',
  onLoad,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const initMap = useCallback(async () => {
  if (!window.ymaps3 || !containerRef.current) return;

  await window.ymaps3.ready;

  // Теперь TypeScript знает типы!
  const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer } = window.ymaps3;

  mapRef.current = new YMap(containerRef.current, {
    location: {
      center,
      zoom,
    },
  });

    mapRef.current.addChild(new YMapDefaultSchemeLayer({}));
mapRef.current.addChild(new YMapDefaultFeaturesLayer({}));

  setIsLoaded(true);
  onLoad?.();
  console.log('✅ Yandex Maps v3 успешно инициализирована');
}, [center, zoom, onLoad]);

  useEffect(() => {
    const key = import.meta.env.VITE_YANDEX_MAPS_API_KEY;

    if (!key) {
      console.error('❌ Нет ключа Yandex Maps в .env (VITE_YANDEX_MAPS_API_KEY)');
      return;
    }

    // Загружаем скрипт только один раз
    if (window.ymaps3) {
      initMap();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://api-maps.yandex.ru/v3/?apikey=${key}&lang=ru_RU`;
    script.async = true;

    script.onload = initMap;

    document.head.appendChild(script);

    return () => {
      // Опционально: очистка при размонтировании
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [initMap]);

  return (
    <div
      ref={containerRef}
      style={{ width, height }}
      className={className}
    >
      {!isLoaded && (
        <div
          style={{
            width: '100%',
            height: '100%',
            background: '#f5f5f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666',
          }}
        >
          Загрузка карты...
        </div>
      )}
    </div>
  );
};

export default YandexMap;