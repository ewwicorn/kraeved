/* ════ STATE ════ */

const S = {
  loggedIn: false,
  user: null,
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

  _apiPosts: [],
  _apiPostsLoaded: false,
  _apiLocMap: {},
  _deletedPostIds: new Set(),
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

function catFromTags(tags) {
  const map = {
    Вино:'wine', Гастро:'gastro', Ферма:'gastro', Природа:'nature',
    Море:'nature', Горы:'active', Трекинг:'active', Релакс:'wellness',
    Культура:'culture', Закат:'nature', Спа:'wellness', Термы:'wellness',
  };
  for (const t of tags) { if (map[t]) return map[t]; }
  return 'nature';
}

/* Возвращает все посты, исключая удалённые в текущей сессии */
function getAllPosts() {
  if (!S._deletedPostIds.size) return [...S._apiPosts];
  return S._apiPosts.filter(p => !S._deletedPostIds.has(String(p.id)));
}

async function loadApiPosts(force) {
  if (S._apiPostsLoaded && !force) return;
  try {
    try {
      const locsRes = await apiLocations({ page_size: 100 });
      const apiLocs = locsRes.items || locsRes || [];
      apiLocs.forEach(loc => { S._apiLocMap[loc.slug] = loc.id; });
    } catch (_) {}

    const res = await apiFeed(1, 50);
    const posts = (res.items || []).map(mapApiPost);
    await resolvePostPhotos(posts);
    // Мёрджим локально сохранённые посты (created offline или при ошибке API)
    const localPosts = getUserPostsLocal();
    const apiIds = new Set(posts.map(p => String(p.id)));
    const uniqueLocal = localPosts.filter(p => !apiIds.has(String(p.id)));
    S._apiPosts = [...uniqueLocal, ...posts];
    S._apiPostsLoaded = true;
  } catch (e) {
    // Даже при ошибке сети — показываем локально сохранённые посты
    S._apiPosts = getUserPostsLocal();
    S._apiPostsLoaded = true;
  }
}
