/* ════ STATE ════ */

const S = {
  loggedIn: false,
  user: null,          // { id, name, email, avatar, first_name, last_name, role }
  obDone: false,
  wishlist: [],
  interactions: 0,
  _savedOnce: {},
  authMode: 'login',
  feedCat: 'all',
  feedLoaded: 15,
  transport: 'car',
  group: 'solo',
  budget: 20000,
  acts: ['gastro', 'eco'],
  curPost: null,
  pmIdx: 0,
  vidInterval: null,
  vidSlide: 0,
  vidImgs: [],
  swapIdx: 0,
  tourPts: [],

  // Кэш постов из API (чтобы не грузить каждый раз)
  _apiPosts: [],
  _apiPostsLoaded: false,
  // Маппинг slug → UUID для API-локаций
  _apiLocMap: {}, // { slug: uuid }
};

/* ── Персистентность ── */
(function restoreState() {
  try {
    const sv = JSON.parse(localStorage.getItem('kv_s') || '{}');
    ['loggedIn','user','obDone','wishlist','interactions','_savedOnce'].forEach(k => {
      if (sv[k] !== undefined) S[k] = sv[k];
    });
  } catch (e) {}
})();

function saveS() {
  try {
    localStorage.setItem('kv_s', JSON.stringify({
      loggedIn:     S.loggedIn,
      user:         S.user,
      obDone:       S.obDone,
      wishlist:     S.wishlist,
      interactions: S.interactions,
      _savedOnce:   S._savedOnce,
    }));
  } catch (e) {}
}

/* ── Вспомогательная функция для категорий тегов ── */
function catFromTags(tags) {
  const map = {
    Вино:'wine', Гастро:'gastro', Ферма:'gastro', Природа:'nature',
    Море:'nature', Горы:'active', Трекинг:'active', Релакс:'wellness',
    Культура:'culture', Закат:'nature', Спа:'wellness', Термы:'wellness',
  };
  for (const t of tags) { if (map[t]) return map[t]; }
  return 'nature';
}

/* ── Получить все посты (статика + API-посты) ── */
function getAllPosts() {
  // API-посты первыми (новее), статика после
  return [...S._apiPosts, ...POSTS];
}

/* ── Загрузить посты из API (с кэшированием) ── */
async function loadApiPosts(force) {
  if (S._apiPostsLoaded && !force) return;
  try {
    // Загружаем локации из API для маппинга slug → UUID
    try {
      const locsRes = await apiLocations({ page_size: 100 });
      const apiLocs = locsRes.items || locsRes || [];
      apiLocs.forEach(loc => { S._apiLocMap[loc.slug] = loc.id; });
    } catch (_) {}

    const res = await apiFeed(1, 50);
    const posts = (res.items || []).map(mapApiPost);
    // Резолвим голые object_name → полные URL (параллельно для всех постов)
    await resolvePostPhotos(posts);
    S._apiPosts = posts;
    S._apiPostsLoaded = true;
  } catch (e) {
    // Бэкенд недоступен — работаем на статических данных
    S._apiPosts = [];
    S._apiPostsLoaded = true;
  }
}