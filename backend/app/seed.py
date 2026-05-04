"""
Seed: теги + локации + пользователи + посты
Запуск: python -m app.seed  (из папки backend/)

Идемпотентный — повторный запуск не создаёт дубликаты.
"""
import asyncio
import uuid

from sqlalchemy import select

from app.core.security import hash_password
from app.db.session import AsyncSessionLocal
from app.models.location import Tag, Location
from app.models.user import User
from app.models.post import Post

# Seed tag data.

TAGS = [
    # Season tags.
    {"slug": "season-spring",  "label_ru": "весна",        "group": "season"},
    {"slug": "season-summer",  "label_ru": "лето",          "group": "season"},
    {"slug": "season-autumn",  "label_ru": "осень",         "group": "season"},
    {"slug": "season-winter",  "label_ru": "зима",          "group": "season"},
    {"slug": "season-all",     "label_ru": "круглый год",   "group": "season"},
    # Activity tags.
    {"slug": "activity-wine",      "label_ru": "винный туризм",     "group": "activity"},
    {"slug": "activity-gastro",    "label_ru": "гастрономия",       "group": "activity"},
    {"slug": "activity-eco",       "label_ru": "эко-туризм",        "group": "activity"},
    {"slug": "activity-agro",      "label_ru": "агро-туризм",       "group": "activity"},
    {"slug": "activity-trekking",  "label_ru": "трекинг",           "group": "activity"},
    {"slug": "activity-culture",   "label_ru": "культурный",        "group": "activity"},
    {"slug": "activity-wellness",  "label_ru": "оздоровительный",   "group": "activity"},
    # Audience tags.
    {"slug": "audience-family",  "label_ru": "семья с детьми",     "group": "audience"},
    {"slug": "audience-senior",  "label_ru": "пенсионный возраст", "group": "audience"},
    {"slug": "audience-remote",  "label_ru": "удалёнщик",          "group": "audience"},
    {"slug": "audience-solo",    "label_ru": "соло",               "group": "audience"},
    {"slug": "audience-couple",  "label_ru": "пара",               "group": "audience"},
]

# Seed location data.

LOCATIONS = [
    {
        "slug": "vedernikov-winery",
        "name": "Винодельня Ведерников",
        "short_description": "Старейшая казачья винодельня на берегу Дона с дегустациями автохтонных сортов.",
        "lat": 47.6231, "lng": 40.8317,
        "location_type": "wine",
        "address": "Ростовская область, ст. Раздорская",
        "photos": ["https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800"],
        "price_from": 1500,
        "tag_slugs": ["activity-wine", "activity-gastro", "season-autumn", "season-summer", "audience-couple"],
    },
    {
        "slug": "abrau-durso",
        "name": "Абрау-Дюрсо",
        "short_description": "Знаменитое шампанское озеро и винный завод с экскурсиями в тоннели.",
        "lat": 44.6870, "lng": 37.5612,
        "location_type": "wine",
        "address": "Краснодарский край, с. Абрау-Дюрсо",
        "photos": ["https://images.unsplash.com/photo-1476611338391-6f395a0ebc7b?w=800"],
        "price_from": 800,
        "tag_slugs": ["activity-wine", "season-all", "audience-couple", "audience-family"],
    },
    {
        "slug": "guzeripl-reserve",
        "name": "Кордон Гузерипль",
        "short_description": "Вход в Кавказский биосферный заповедник — зубры, горные тропы, тишина.",
        "lat": 43.9928, "lng": 40.1872,
        "location_type": "mountains",
        "address": "Краснодарский край, пос. Гузерипль",
        "photos": ["https://images.unsplash.com/photo-1448375240586-882707db888b?w=800"],
        "price_from": 300,
        "tag_slugs": ["activity-eco", "activity-trekking", "season-spring", "season-summer", "season-autumn", "audience-solo"],
    },
    {
        "slug": "farm-kuban-berries",
        "name": "Ферма «Кубанская ягода»",
        "short_description": "Агротуризм: сбор клубники, мастер-классы по варенью, ночёвка в домиках.",
        "lat": 45.1234, "lng": 38.9876,
        "location_type": "farm",
        "address": "Краснодарский край, Динской район",
        "photos": ["https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=800"],
        "price_from": 2000,
        "tag_slugs": ["activity-agro", "activity-gastro", "season-summer", "audience-family", "audience-couple"],
    },
    {
        "slug": "stanitsa-taman",
        "name": "Станица Тамань",
        "short_description": "Казачья станица, музей Лермонтова, виноградники у Керченского пролива.",
        "lat": 45.2107, "lng": 36.7144,
        "location_type": "culture",
        "address": "Краснодарский край, ст. Тамань",
        "photos": ["https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=800"],
        "price_from": 500,
        "tag_slugs": ["activity-culture", "activity-wine", "season-spring", "season-autumn", "audience-senior", "audience-couple"],
    },
    {
        "slug": "rufabgo-waterfalls",
        "name": "Водопады Руфабго",
        "short_description": "Каскад из восьми водопадов в ущелье реки Руфабго — нетронутая природа в получасе от Майкопа.",
        "lat": 44.0761, "lng": 40.1183,
        "location_type": "eco",
        "address": "Республика Адыгея, пос. Каменномостский",
        "photos": ["https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=800"],
        "price_from": 200,
        "tag_slugs": ["activity-eco", "activity-trekking", "season-spring", "season-summer", "season-autumn", "audience-family", "audience-solo"],
    },
    {
        "slug": "lago-naki-plateau",
        "name": "Лагонакское нагорье",
        "short_description": "Высокогорное плато с альпийскими лугами, пещерами и видами на снежные вершины — малопосещаемая жемчужина Западного Кавказа.",
        "lat": 44.0220, "lng": 40.0250,
        "location_type": "mountains",
        "address": "Республика Адыгея / Краснодарский край",
        "photos": ["https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800"],
        "price_from": 0,
        "tag_slugs": ["activity-trekking", "activity-eco", "season-summer", "season-autumn", "audience-solo", "audience-couple"],
    },
    {
        "slug": "khadzhokh-gorge",
        "name": "Хаджохская теснина",
        "short_description": "Каньон глубиной 40 метров и шириной всего 2 метра — река Белая прорезала скалу за тысячи лет.",
        "lat": 44.0697, "lng": 40.1872,
        "location_type": "eco",
        "address": "Краснодарский край, пос. Каменномостский (Хаджох)",
        "photos": ["https://images.unsplash.com/photo-1504700610630-ac6aba3536d3?w=800"],
        "price_from": 150,
        "tag_slugs": ["activity-eco", "season-spring", "season-summer", "season-autumn", "audience-family", "audience-couple"],
    },
    {
        "slug": "bolshaya-azishskaya-cave",
        "name": "Большая Азишская пещера",
        "short_description": "Сталактитовая пещера на высоте 1500 м — одна из самых красивых в России, но известная лишь местным.",
        "lat": 44.0014, "lng": 40.0681,
        "location_type": "eco",
        "address": "Краснодарский край, Майкопский район",
        "photos": ["https://images.unsplash.com/photo-1504198266287-1659872e6590?w=800"],
        "price_from": 400,
        "tag_slugs": ["activity-eco", "season-all", "audience-family", "audience-senior"],
    },
    {
        "slug": "psebay-village",
        "name": "Посёлок Псебай и долина Малой Лабы",
        "short_description": "Тихий казачий посёлок у подножия Кавказского хребта — стартовая точка для маршрутов в заповедник без толп туристов.",
        "lat": 43.8889, "lng": 40.7611,
        "location_type": "eco",
        "address": "Краснодарский край, Мостовский район, пос. Псебай",
        "photos": ["https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=800"],
        "price_from": 1200,
        "tag_slugs": ["activity-eco", "activity-trekking", "season-summer", "season-spring", "audience-solo", "audience-couple", "audience-remote"],
    },
    {
        "slug": "gorky-farm-adygea",
        "name": "Сыроварня в Адыгее «Горный хутор»",
        "short_description": "Семейная сыроварня в горах — дегустация адыгейского сыра, экскурсия на производство и ночлег в домиках.",
        "lat": 44.1540, "lng": 40.2210,
        "location_type": "farm",
        "address": "Республика Адыгея, Майкопский район",
        "photos": ["https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=800"],
        "price_from": 1800,
        "tag_slugs": ["activity-agro", "activity-gastro", "season-all", "audience-family", "audience-couple"],
    },
    {
        "slug": "kuban-steppe-bird-watching",
        "name": "Степи Приазовья — птичий рай",
        "short_description": "Плавни и лиманы в дельте Кубани — зимовка тысяч птиц, в том числе редких: пеликанов, цапель, лебедей.",
        "lat": 45.7892, "lng": 37.3541,
        "location_type": "eco",
        "address": "Краснодарский край, Приморско-Ахтарский район",
        "photos": ["https://images.unsplash.com/photo-1470114716159-e389f8712fda?w=800"],
        "price_from": 0,
        "tag_slugs": ["activity-eco", "season-autumn", "season-winter", "season-spring", "audience-solo", "audience-couple"],
    },
]

# Seed user data.

USERS = [
    {
        "email": "admin@kraytour.ru",
        "password": "Admin1234",
        "first_name": "Админ",
        "last_name": "Краевед",
        "role": "admin",
    },
    {
        "email": "seller@kraytour.ru",
        "password": "Seller1234",
        "first_name": "Иван",
        "last_name": "Виноградов",
        "role": "seller",
    },
    {
        "email": "buyer1@kraytour.ru",
        "password": "Buyer1234",
        "first_name": "Алексей",
        "last_name": "Петров",
        "role": "buyer",
    },
    {
        "email": "buyer2@kraytour.ru",
        "password": "Buyer1234",
        "first_name": "Мария",
        "last_name": "Иванова",
        "role": "buyer",
    },
]

# Seed post data.
# Use author_email and location_slug to link seed posts.

POSTS = [
    {
        "title": "Лучшая дегустация в моей жизни",
        "content": "Провели на винодельне Ведерников почти весь день. Хозяин лично провёл экскурсию по погребам, рассказал про автохтонные сорта — Цимлянский чёрный, Красностоп. Вина совершенно другие, не похожие на массовые. Взяли с собой несколько бутылок.",
        "photos": ["https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800"],
        "tags": ["вино", "дегустация", "казаки"],
        "author_email": "buyer1@kraytour.ru",
        "location_slug": "vedernikov-winery",
        "lat": 47.6231, "lng": 40.8317,
        "likes_count": 24,
    },
    {
        "title": "Осенний Дон — это что-то особенное",
        "content": "Приехали в октябре — виноград уже собран, но атмосфера потрясающая. Туман над рекой утром, тишина, запах выжимок. Рекомендую именно осенний визит.",
        "photos": ["https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800"],
        "tags": ["осень", "вино", "природа", "Дон"],
        "author_email": "buyer2@kraytour.ru",
        "location_slug": "vedernikov-winery",
        "lat": 47.6231, "lng": 40.8317,
        "likes_count": 17,
    },
    {
        "title": "Абрау — не только вино",
        "content": "Все знают Абрау-Дюрсо как винный завод, но мало кто говорит про озеро. Можно взять лодку и покататься — вид на горы отражается в воде. Закат здесь просто нереальный.",
        "photos": ["https://images.unsplash.com/photo-1476611338391-6f395a0ebc7b?w=800"],
        "tags": ["озеро", "вино", "закат", "Краснодар"],
        "author_email": "buyer1@kraytour.ru",
        "location_slug": "abrau-durso",
        "lat": 44.6870, "lng": 37.5612,
        "likes_count": 41,
    },
    {
        "title": "Экскурсия в тоннели завода",
        "content": "Тоннели уходят глубоко в гору — там постоянные 12 градусов. Ряды бутылок уходят в темноту. Экскурсовод рассказывает про метод шампанизации. В конце дегустация прямо в тоннеле.",
        "photos": ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800"],
        "tags": ["вино", "шампанское", "экскурсия", "тоннели"],
        "author_email": "seller@kraytour.ru",
        "location_slug": "abrau-durso",
        "lat": 44.6870, "lng": 37.5612,
        "likes_count": 33,
    },
    {
        "title": "Зубры в дикой природе",
        "content": "Добрались до кордона Гузерипль ранним утром. На тропе встретили зубра метрах в тридцати — он просто смотрел на нас и жевал траву. Такого нигде больше не увидишь.",
        "photos": ["https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=800"],
        "tags": ["природа", "зубры", "заповедник", "горы"],
        "author_email": "buyer2@kraytour.ru",
        "location_slug": "guzeripl-reserve",
        "lat": 43.9928, "lng": 40.1872,
        "likes_count": 58,
    },
    {
        "title": "Однодневный поход — маршрут и советы",
        "content": "Начали от кордона в 8 утра, прошли около 14 км, вернулись к 17:00. Обязательно берите пропуск заранее — без него не пустят. Из еды достаточно перекуса, воду можно набирать из горных ручьёв. Трекинговые палки очень помогут на спуске.",
        "photos": ["https://images.unsplash.com/photo-1551632811-561732d1e306?w=800"],
        "tags": ["трекинг", "маршрут", "советы", "Кавказ"],
        "author_email": "buyer1@kraytour.ru",
        "location_slug": "guzeripl-reserve",
        "lat": 43.9928, "lng": 40.1872,
        "likes_count": 45,
    },
    {
        "title": "Весенний поход — всё в цвету",
        "content": "Май — лучшее время. Рододендроны цветут прямо на тропе, снег ещё лежит на вершинах, а внизу уже тепло. Воздух такой, что хочется дышать и дышать.",
        "photos": ["https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800"],
        "tags": ["весна", "цветы", "горы", "природа"],
        "author_email": "buyer2@kraytour.ru",
        "location_slug": "guzeripl-reserve",
        "lat": 43.9928, "lng": 40.1872,
        "likes_count": 29,
    },
    {
        "title": "Клубника прямо с грядки",
        "content": "Приехали с детьми в июне. Каждый собирал сам — дети были в восторге. Потом мастер-класс по варенью: варили в медном тазу на открытом огне. Ночевали в домике — чисто, уютно, пели птицы.",
        "photos": ["https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=800"],
        "tags": ["агро", "клубника", "дети", "семья"],
        "author_email": "buyer2@kraytour.ru",
        "location_slug": "farm-kuban-berries",
        "lat": 45.1234, "lng": 38.9876,
        "likes_count": 36,
    },
    {
        "title": "Настоящая кубанская кухня",
        "content": "Хозяйка накормила борщом, варениками и домашней колбасой. Всё из своего хозяйства. После обеда показала огород — помидоры, перец, баклажаны. Такого борща я не ел нигде.",
        "photos": ["https://images.unsplash.com/photo-1547592180-85f173990554?w=800"],
        "tags": ["гастро", "кубанская кухня", "фермерское", "борщ"],
        "author_email": "buyer1@kraytour.ru",
        "location_slug": "farm-kuban-berries",
        "lat": 45.1234, "lng": 38.9876,
        "likes_count": 22,
    },
    {
        "title": "Тамань — место силы",
        "content": "Лермонтов описывал Тамань как «самый скверный городишко». Теперь здесь тихая казачья станица и прекрасный музей. Виноградники уходят прямо к проливу — вид фантастический.",
        "photos": ["https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800"],
        "tags": ["культура", "Лермонтов", "казаки", "история"],
        "author_email": "buyer1@kraytour.ru",
        "location_slug": "stanitsa-taman",
        "lat": 45.2107, "lng": 36.7144,
        "likes_count": 19,
    },
    {
        "title": "Вина Тамани недооценены",
        "content": "Местные хозяйства делают отличное вино — совсем не то, что в магазине под тем же названием. Купили несколько бутылок прямо у фермера. Рислинг и Мускат особенно понравились.",
        "photos": ["https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?w=800"],
        "tags": ["вино", "Тамань", "фермерское", "дегустация"],
        "author_email": "buyer2@kraytour.ru",
        "location_slug": "stanitsa-taman",
        "lat": 45.2107, "lng": 36.7144,
        "likes_count": 27,
    },
    {
        "title": "Закат над Керченским проливом",
        "content": "Поднялись на холм над станицей перед закатом. Видно Керченский пролив, вдали — Крым. Оранжевое небо, виноградники внизу. Один из лучших видов в моей жизни.",
        "photos": ["https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=800"],
        "tags": ["закат", "пролив", "вид", "Тамань"],
        "author_email": "seller@kraytour.ru",
        "location_slug": "stanitsa-taman",
        "lat": 45.2107, "lng": 36.7144,
        "likes_count": 51,
    },
    # Additional posts for less popular locations.
    {
        "title": "Водопады Руфабго — лучше чем ожидали",
        "content": "Ехали скептически — думали, просто ручейки. Оказалось совсем не так. Первый водопад «Девичья коса» уже поражает. Но дойдите до четвёртого — «Чаша любви» — там можно искупаться в природном бассейне. Тропа несложная, подходит для детей лет с шести. Вход платный, но символический. Из Майкопа — 30 минут на машине.",
        "photos": ["https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=800"],
        "tags": ["водопады", "Адыгея", "природа", "треккинг"],
        "author_email": "buyer1@kraytour.ru",
        "location_slug": "rufabgo-waterfalls",
        "lat": 44.0761, "lng": 40.1183,
        "likes_count": 47,
    },
    {
        "title": "Купались в водопаде в октябре — и не пожалели",
        "content": "Многие думают, что Руфабго — только летнее место. Мы приехали в начале октября: листья жёлтые, туристов почти нет, воздух чистый. Вода холодная, но в «Чаше любви» минут пять вполне можно просидеть. Эхо в ущелье потрясающее.",
        "photos": ["https://images.unsplash.com/photo-1473773508845-188df298d2d1?w=800"],
        "tags": ["осень", "водопады", "Адыгея", "нетуристическое"],
        "author_email": "buyer2@kraytour.ru",
        "location_slug": "rufabgo-waterfalls",
        "lat": 44.0761, "lng": 40.1183,
        "likes_count": 31,
    },
    {
        "title": "Лагонаки — плато на краю земли",
        "content": "Поднялись на Лагонакское нагорье в августе. На высоте 2000 м — альпийские луга, цветут горечавки и рододендроны. Видно снег на Фишт-Оштеновском массиве. За весь день встретили только одну пару туристов. Ощущение, что ты открыл что-то своё. Добираться — грунтовка от посёлка Хамышки, нужен высокий клиренс.",
        "photos": ["https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800"],
        "tags": ["горы", "плато", "Адыгея", "соло", "нетуристическое"],
        "author_email": "buyer1@kraytour.ru",
        "location_slug": "lago-naki-plateau",
        "lat": 44.0220, "lng": 40.0250,
        "likes_count": 53,
    },
    {
        "title": "Закат на Лагонаки — фото не передаёт",
        "content": "Остались ночевать в палатке прямо на плато. Закат красил Фишт в розовый, потом пришёл густой туман. Ночью звёзды — Млечный Путь видно невооружённым глазом. Температура упала до +6, хотя днём было +22. Берите тёплые вещи даже летом.",
        "photos": ["https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800"],
        "tags": ["кемпинг", "закат", "звёзды", "горы", "Адыгея"],
        "author_email": "buyer2@kraytour.ru",
        "location_slug": "lago-naki-plateau",
        "lat": 44.0220, "lng": 40.0250,
        "likes_count": 68,
    },
    {
        "title": "Хаджохская теснина — 2 метра между скалами",
        "content": "Не мог поверить, что такое бывает в Краснодарском крае. Идёшь по мостику, а по бокам — вертикальные стены высотой 40 метров, расстояние между ними иногда меньше двух метров. Внизу ревёт Белая. Весной, в половодье, зрелище особенно мощное — вода рычит и пенится. Экскурсия занимает минут сорок, стоит копейки.",
        "photos": ["https://images.unsplash.com/photo-1504700610630-ac6aba3536d3?w=800"],
        "tags": ["каньон", "Белая", "природа", "Хаджох", "необычное"],
        "author_email": "buyer2@kraytour.ru",
        "location_slug": "khadzhokh-gorge",
        "lat": 44.0697, "lng": 40.1872,
        "likes_count": 44,
    },
    {
        "title": "Маршрут на выходные: Хаджох и Руфабго за один день",
        "content": "Утром — теснина (40 мин), потом 10 минут езды до Руфабго, там 3 часа. Пообедали в кафе в Каменномостском — хинкали и шашлык. Вернулись в Майкоп к вечеру. Отличный формат без ночёвки. Суммарно потратили около 1200 рублей на двоих, включая еду.",
        "photos": ["https://images.unsplash.com/photo-1501554728187-ce583db33af7?w=800"],
        "tags": ["маршрут", "выходные", "Адыгея", "советы", "бюджетно"],
        "author_email": "buyer1@kraytour.ru",
        "location_slug": "khadzhokh-gorge",
        "lat": 44.0697, "lng": 40.1872,
        "likes_count": 39,
    },
    {
        "title": "Азишская пещера — сталактиты в тысячах",
        "content": "Ехали мимо и заехали наугад — и попали в один из лучших дней поездки. Экскурсовод рассказывал про формирование сталактитов и сталагмитов — оказывается, некоторым из них больше 10 тысяч лет. Внутри +5, берите куртку. Пещера небольшая, но очень красивая. Рядом смотровая — виды на лес и горы.",
        "photos": ["https://images.unsplash.com/photo-1504198266287-1659872e6590?w=800"],
        "tags": ["пещера", "сталактиты", "Адыгея", "природа"],
        "author_email": "buyer1@kraytour.ru",
        "location_slug": "bolshaya-azishskaya-cave",
        "lat": 44.0014, "lng": 40.0681,
        "likes_count": 35,
    },
    {
        "title": "Псебай — место, где нет туристов",
        "content": "Случайно наткнулись на Псебай в поиске маршрутов по Кавказскому заповеднику. Тихий посёлок, казачьи дома, рядом — несколько троп разной сложности. Снимали комнату у местных — 600 рублей в сутки с завтраком. Хозяин Виктор Павлович нарисовал нам карту маршрутов от руки. Такого гостеприимства давно не встречали.",
        "photos": ["https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=800"],
        "tags": ["нетуристическое", "заповедник", "горы", "Кубань", "местные"],
        "author_email": "buyer2@kraytour.ru",
        "location_slug": "psebay-village",
        "lat": 43.8889, "lng": 40.7611,
        "likes_count": 29,
    },
    {
        "title": "Работаю удалённо из Псебая уже третью неделю",
        "content": "Приехал на выходные — остался на месяц. Интернет есть (Билайн ловит), воздух горный, тишина. Снял домик за 12 тысяч в месяц. Утром работаю, после обеда — тропы вдоль Малой Лабы. Если вы ищете место для цифрового номадизма без Бали и Тбилиси — вот оно.",
        "photos": ["https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800"],
        "tags": ["удалёнка", "номад", "горы", "Псебай", "Кубань"],
        "author_email": "buyer1@kraytour.ru",
        "location_slug": "psebay-village",
        "lat": 43.8889, "lng": 40.7611,
        "likes_count": 82,
    },
    {
        "title": "Адыгейский сыр прямо с производства",
        "content": "Заехали на «Горный хутор» почти случайно — увидели указатель с дороги. Хозяйка Зарема провела по сыроварне — показала весь процесс от молока до готового сыра. Попробовали пять видов, включая выдержанный и копчёный. Купили три головы домой. Остались ночевать — завтрак с домашним сыром, яйцами и травяным чаем.",
        "photos": ["https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=800"],
        "tags": ["сыр", "Адыгея", "агротуризм", "гастро", "ферма"],
        "author_email": "buyer2@kraytour.ru",
        "location_slug": "gorky-farm-adygea",
        "lat": 44.1540, "lng": 40.2210,
        "likes_count": 41,
    },
    {
        "title": "Пеликаны в Приазовье — я не верил, пока не увидел",
        "content": "Орнитолог-любитель, объездил много мест. Приазовские плавни — совершенно недооценённое место. Розовые пеликаны, кудрявые пеликаны (редчайший вид!), тысячи уток, лебеди. Лучшее время — ноябрь и март. Берите бинокль и резиновые сапоги. До ближайшей гостиницы — Приморско-Ахтарск, 20 км.",
        "photos": ["https://images.unsplash.com/photo-1470114716159-e389f8712fda?w=800"],
        "tags": ["птицы", "пеликаны", "природа", "Приазовье", "нетуристическое"],
        "author_email": "buyer1@kraytour.ru",
        "location_slug": "kuban-steppe-bird-watching",
        "lat": 45.7892, "lng": 37.3541,
        "likes_count": 56,
    },

    # Posts without linked locations are general travel impressions.
    {
        "title": "Краснодарский край — открытие года",
        "content": "Объездили за две недели пять мест. Нигде не разочаровались. Цены разумные, люди приветливые, природа разнообразная — горы, степи, море рядом. Обязательно вернёмся.",
        "photos": ["https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800"],
        "tags": ["Краснодар", "путешествие", "открытие"],
        "author_email": "buyer1@kraytour.ru",
        "location_slug": None,
        "lat": 45.04, "lng": 38.98,
        "likes_count": 63,
    },
    {
        "title": "Что взять с собой в горы Адыгеи",
        "content": "Список снаряжения после трёх походов: трекинговые палки обязательны, термос важнее чем кажется, дождевик нужен даже в июле — погода меняется быстро. Берите наличные — карты не везде принимают.",
        "photos": ["https://images.unsplash.com/photo-1522163182402-834f871fd851?w=800"],
        "tags": ["советы", "горы", "снаряжение", "Адыгея"],
        "author_email": "buyer2@kraytour.ru",
        "location_slug": None,
        "lat": 44.0, "lng": 40.0,
        "likes_count": 38,
    },
    {
        "title": "Лучшее время для поездки в Краснодарский край",
        "content": "Май–июнь и сентябрь–октябрь — золотые месяцы. Летом слишком жарко в степи и много людей на побережье. Весной и осенью тепло, всё зелёное, туристов меньше, цены ниже.",
        "photos": ["https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800"],
        "tags": ["советы", "сезон", "планирование"],
        "author_email": "seller@kraytour.ru",
        "location_slug": None,
        "lat": 45.04, "lng": 38.98,
        "likes_count": 44,
    },
]


# Seed routine.

async def seed():
    async with AsyncSessionLocal() as db:

        # Skip tags that already exist.
        existing_tags = (await db.execute(select(Tag))).scalars().all()
        tag_map: dict[str, Tag] = {t.slug: t for t in existing_tags}

        new_tags = 0
        for t in TAGS:
            if t["slug"] not in tag_map:
                tag = Tag(id=uuid.uuid4(), **t)
                db.add(tag)
                tag_map[t["slug"]] = tag
                new_tags += 1

        await db.flush()

        # Skip locations that already exist.
        existing_slugs = {
            row[0] for row in (await db.execute(select(Location.slug))).all()
        }

        loc_map: dict[str, Location] = {}
        new_locs = 0
        for loc_data in LOCATIONS:
            tag_slugs = loc_data.pop("tag_slugs")
            if loc_data["slug"] not in existing_slugs:
                location = Location(id=uuid.uuid4(), is_active=True, **loc_data)
                location.tags = [tag_map[s] for s in tag_slugs]
                db.add(location)
                new_locs += 1
            # Add each location to the lookup map, whether new or existing.
            loc_data["tag_slugs"] = tag_slugs  # Restore source data.

        await db.flush()

        # Reload locations to fetch their database IDs.
        all_locs = (await db.execute(select(Location))).scalars().all()
        loc_map = {loc.slug: loc for loc in all_locs}

        # Skip users that already exist.
        existing_emails = {
            row[0] for row in (await db.execute(select(User.email))).all()
        }

        user_map: dict[str, User] = {}
        new_users = 0
        for u in USERS:
            if u["email"] not in existing_emails:
                user = User(
                    id=uuid.uuid4(),
                    email=u["email"],
                    password_hash=hash_password(u["password"]),
                    first_name=u["first_name"],
                    last_name=u["last_name"],
                    role=u["role"],
                )
                db.add(user)
                new_users += 1

        await db.flush()

        # Reload all users.
        all_users = (await db.execute(select(User))).scalars().all()
        user_map = {u.email: u for u in all_users}

        # Skip posts that already exist for the same title.
        existing_titles = {
            row[0] for row in (await db.execute(select(Post.title))).all()
        }

        new_posts = 0
        for p in POSTS:
            if p["title"] in existing_titles:
                continue

            author = user_map.get(p["author_email"])
            location = loc_map.get(p["location_slug"]) if p["location_slug"] else None

            post = Post(
                id=uuid.uuid4(),
                title=p["title"],
                content=p["content"],
                photos=p["photos"],
                tags=p["tags"],
                author_id=author.id if author else None,
                location_id=location.id if location else None,
                lat=p.get("lat"),
                lng=p.get("lng"),
                likes_count=p.get("likes_count", 0),
                is_moderated=True,
            )
            db.add(post)
            new_posts += 1

        await db.commit()

        print(f"✓ Tags:     {new_tags} new (total {len(tag_map)})")
        print(f"✓ Locations: {new_locs} new (total {len(loc_map)})")
        print(f"✓ Users:    {new_users} new (total {len(user_map)})")
        print(f"✓ Posts:    {new_posts} new")
        print()
        print("Demo credentials:")
        for u in USERS:
            print(f"  {u['role']:8} {u['email']}  /  {u['password']}")


if __name__ == "__main__":
    asyncio.run(seed())