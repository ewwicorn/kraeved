/* ════ STATIC DATA ════ */

// Статические посты и локации-заглушки удалены.
// Все данные загружаются из API.

const POSTS     = []; // оставлен для совместимости, всегда пуст
const LOCATIONS = []; // оставлен для совместимости, всегда пуст

const LOC_ICONS = {
  winery:   '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M18 3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v2a9 9 0 0 0 4 7.5V19H8a1 1 0 0 0 0 2h8a1 1 0 0 0 0-2h-2v-6.5A9 9 0 0 0 18 5V3z"/></svg>',
  waterfall:'<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H7l5-8v4h4l-5 8z"/></svg>',
  mountain: '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M14 6l-1-2H5v17h2v-7h5l1 2h7V6h-6zm4 8h-4l-1-2H7V6h5l1 2h5v6z"/></svg>',
  farm:     '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M19 9l-7-7-7 7v11h5v-5h4v5h5V9z"/></svg>',
  beach:    '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M13.127 14.56l1.43-1.43 6.44 6.443L19.57 21zm4.293-5.73l2.83-2.829-1.414-1.414-.707.707-1.414-1.414L19 2.988 14.988 7l1.414 1.414-.707.707 1.417 1.419zm-6.413-.73l-4.47-4.47a2 2 0 0 0-2.828 2.829l4.47 4.47a2 2 0 0 0 2.829-2.83z"/></svg>',
  spa:      '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 22c4.97 0 9-4.03 9-9-4.97 0-9 4.03-9 9zm0 0c0-4.97-4.03-9-9-9 0 4.97 4.03 9 9 9zm0-18C9.8 6.14 8 8.33 8 11h8c0-2.67-1.8-4.86-4-5z"/></svg>',
  culture:  '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 3L2 12h3v8h6v-5h2v5h6v-8h3L12 3z"/></svg>',
  gastro:   '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/></svg>',
  other:    '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>',
};

const LOC_COLORS = {
  winery:'#8B3A7A', waterfall:'#2E7D9E', mountain:'#4A6741',
  farm:'#8B6914', beach:'#1565C0', spa:'#6A5ACD', culture:'#B8420A',
  gastro:'#C4603B', other:'#5A6A7A',
};

const OB_STEPS = [
  {q:'Что тебе ближе?',cards:[{img:'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=700&q=80',lbl:'Природа и тишина',sub:'Леса, горы, водопады'},{img:'https://images.unsplash.com/photo-1498503182468-3b51cbb6cb24?w=700&q=80',lbl:'Город и культура',sub:'Кафе, музеи, прогулки'}]},
  {q:'Как ты отдыхаешь?',cards:[{img:'https://images.unsplash.com/photo-1551524559-8af4e6624178?w=700&q=80',lbl:'Активно',sub:'Горы, трекинг, велосипеды'},{img:'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=700&q=80',lbl:'Пассивно',sub:'Спа, лежак, тишина'}]},
  {q:'Что важнее в поездке?',cards:[{img:'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=700&q=80',lbl:'Еда и вкусы',sub:'Рестораны, рынки, фермы'},{img:'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=700&q=80',lbl:'Впечатления',sub:'Виноделие, закаты, атмосфера'}]},
  {q:'Кто едет с тобой?',cards:[{img:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=700&q=80',lbl:'Один или вдвоём',sub:'Соло или пара'},{img:'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=700&q=80',lbl:'Компания или семья',sub:'Друзья, дети'}]},
  {q:'Какая атмосфера?',cards:[{img:'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=700&q=80',lbl:'Дикая природа',sub:'Без людей, без интернета'},{img:'https://images.unsplash.com/photo-1474722883778-792e7990302f?w=700&q=80',lbl:'Уют и комфорт',sub:'Хороший отель, всё включено'}]},
];

const BASE_TOUR = [
  {day:1,ord:1,n:'Краснодар. Рынок Кирова',type:'Рынок',tags:['Гастро','Фермерское'],why:'Старт с лучшего фермерского рынка края — сыры, мёд и правильный настрой на поездку.',arrive:'09:00',drive:0,lat:45.040,lon:38.976,img:'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&q=80',url:'https://sutochno.ru/krasnodar'},
  {day:1,ord:2,n:'Абрау-Дюрсо',type:'Винодельня',tags:['Вино','Природа'],why:'Ты выбирал вино и уединение — лучшего старта не придумать.',arrive:'13:00',drive:150,lat:44.708,lon:37.565,img:'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=800&q=80',url:'https://sutochno.ru/novorossiysk'},
  {day:2,ord:1,n:'Мысхако. Чёрные скалы',type:'Виноградник',tags:['Вино','Закат'],why:'Виноград над морем — утреннее место с панорамой на всю бухту.',arrive:'10:00',drive:40,lat:44.744,lon:37.671,img:'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80',url:'https://sutochno.ru/novorossiysk'},
  {day:2,ord:2,n:'Долина Пшада',type:'Природный маршрут',tags:['Трекинг','Водопады'],why:'Нетронутые водопады — то, что ты искал в дикой природе.',arrive:'14:00',drive:90,lat:44.571,lon:38.058,img:'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80',url:'https://sutochno.ru/gelendzhik'},
  {day:3,ord:1,n:'Агроферма Привет',type:'Ферма',tags:['Гастро','Эко'],why:'Фермерский обед с видом на горы — еда как впечатление.',arrive:'11:00',drive:30,lat:44.551,lon:38.152,img:'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&q=80',url:'https://sutochno.ru/gelendzhik'},
  {day:3,ord:2,n:'Геленджик. Набережная',type:'Море / Город',tags:['Море','Прогулка'],why:'Финальный день у моря — кофе, рыбный рынок, закат.',arrive:'15:00',drive:25,lat:44.558,lon:38.077,img:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',url:'https://sutochno.ru/gelendzhik'},
];

const SWAP_POOL = [
  {n:'Дольмены Геленджика',type:'Культура',tags:['История','Мистика'],why:'Загадочные мегалиты — нетривиальная точка для любителей глубины.',arrive:'10:30',drive:35,lat:44.518,lon:38.021,img:'https://images.unsplash.com/photo-1562176566-e9afd27531d4?w=800&q=80'},
  {n:'Горячий Ключ',type:'Термальный курорт',tags:['Термы','Релакс'],why:'Лечебные воды после активного дня — лучший способ восстановиться.',arrive:'11:00',drive:50,lat:44.63,lon:39.13,img:'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80'},
  {n:'Красная Поляна',type:'Горный курорт',tags:['Горы','Вид'],why:'Канатная дорога и виды на хребет — один из лучших панорамных маршрутов.',arrive:'09:30',drive:70,lat:43.68,lon:40.21,img:'https://images.unsplash.com/photo-1551524559-8af4e6624178?w=800&q=80'},
  {n:'Лагонаки',type:'Плато',tags:['Трекинг','Туман'],why:'Горное плато — мистика и виды.',arrive:'08:30',drive:80,lat:44.045,lon:39.892,img:'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80'},
];

const HOTELS = [
  {n:'Villa Abrau Boutique',p:'4 800 ₽/ночь',r:'4.9',img:'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=200&q=80',url:'https://sutochno.ru/abrau-dyurso'},
  {n:'Gelendzhik Bay House',p:'3 200 ₽/ночь',r:'4.7',img:'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=200&q=80',url:'https://sutochno.ru/gelendzhik'},
  {n:'Эко-домик в Пшаде',p:'2 400 ₽/ночь',r:'4.8',img:'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=200&q=80',url:'https://sutochno.ru/pshada'},
];
