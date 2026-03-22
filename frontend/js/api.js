/* ════ API CLIENT ════
   Все запросы к бэкенду идут через этот модуль.
   Токен хранится в localStorage под ключом 'kv_token'.
═══════════════════════════════════════════════════════ */

async function apiRequest(method, path, body = null, isMultipart = false) {
  const token = localStorage.getItem('kv_token');
  const headers = {};
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const opts = { method, headers };
  if (body && !isMultipart) {
    headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  } else if (body && isMultipart) {
    opts.body = body; // FormData — браузер сам ставит Content-Type с boundary
  }

  let res;
  try {
    res = await fetch(API_BASE + path, opts);
  }
  catch (err) {
    console.log('API request error:', err);
    throw err;
  }

  if (!res.ok) {
    let detail = 'Ошибка сервера';
    try { const e = await res.json(); detail = e.detail || detail; } catch (_) {}
    const err = new Error(detail);
    err.status = res.status;
    throw err;
  }

  if (res.status === 204) return null;
  return res.json();
}

/* ── Auth ── */
function apiRegister(data)  { return apiRequest('POST', '/auth/register', data); }
function apiLogin(data)     { return apiRequest('POST', '/auth/login', data); }
function apiMe()            { return apiRequest('GET',  '/auth/me'); }
function apiLogout()        { return apiRequest('POST', '/auth/logout'); }

/* ── Posts ── */
function apiFeed(page, pageSize, tags) {
  const p = new URLSearchParams({ page: page || 1, page_size: pageSize || 20 });
  if (tags && tags.length) tags.forEach(t => p.append('tags', t));
  return apiRequest('GET', '/posts?' + p.toString());
}
function apiGetPost(id)     { return apiRequest('GET',  '/posts/' + id); }
function apiCreatePost(data){ return apiRequest('POST', '/posts', data); }
function apiDeletePost(id)  { return apiRequest('DELETE', '/posts/' + id); }
function apiLikePost(id)    { return apiRequest('POST', '/posts/' + id + '/like'); }

/* ── Locations ── */
function apiLocations(params) {
  const p = new URLSearchParams(params || {});
  return apiRequest('GET', '/locations?' + p.toString());
}
function apiLocationDetail(slug) { return apiRequest('GET', '/locations/' + slug); }
function apiLocationTags()       { return apiRequest('GET', '/locations/tags'); }

/* ── Files ── */
function apiUploadFile(file) {
  const fd = new FormData();
  fd.append('file', file);
  return apiRequest('POST', '/files/upload', fd, true);
}
function apiFileUrl(objectName) { return apiRequest('GET', '/files/url/' + objectName); }
function apiDeleteFile(objectName) { return apiRequest('DELETE', '/files/' + objectName); }

/* ── Helpers ── */

/**
 * Проверяет, является ли строка полноценным URL или data-URI.
 * Если нет — это просто object_name из MinIO (например "jeeping.jpeg").
 */
function isAbsoluteUrl(str) {
  return typeof str === 'string' && (
    str.startsWith('http://') ||
    str.startsWith('https://') ||
    str.startsWith('data:') ||
    str.startsWith('blob:')
  );
}

/**
 * Резолвит одну фотографию:
 * - Если уже абсолютный URL — возвращает как есть.
 * - Если это object_name (просто имя файла) — запрашивает GET /files/url/{name}.
 * GET /files/url/ не требует авторизации согласно бэкенду.
 */
async function resolvePhotoUrl(photo) {
  if (!photo) return null;
  if (isAbsoluteUrl(photo)) return photo;
  // Голый object_name — идём за URL
  try {
    const res = await apiFileUrl(encodeURIComponent(photo));
    return (res && res.url) ? res.url : null;
  } catch (_) {
    return null; // не смогли получить — скрываем
  }
}

/**
 * Резолвит все фотографии в массиве постов параллельно.
 * Вызывается после mapApiPost, потому что mapApiPost синхронный.
 */
async function resolvePostPhotos(posts) {
  await Promise.all(posts.map(async post => {
    // Резолвим все фото параллельно
    const resolved = await Promise.all(post.imgs.map(resolvePhotoUrl));
    const valid = resolved.filter(Boolean);
    if (valid.length) {
      post.imgs = valid;
      post.img  = valid[0];
    }
    // Если ни одно фото не резолвилось — оставляем placeholder (уже стоит из mapApiPost)
  }));
  return posts;
}

/** Преобразует пост из формата API в формат, понятный фронту */
function mapApiPost(p) {
  const authorName = p.author
    ? (p.author.first_name + ' ' + p.author.last_name).trim()
    : 'Путешественник';
  const photos = Array.isArray(p.photos) ? p.photos : [];
  const tags   = Array.isArray(p.tags)   ? p.tags   : [];

  const PLACEHOLDER = 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=700&q=80';

  // Сразу используем фото как есть — resolvePostPhotos заменит их на полные URL асинхронно
  const imgList = photos.length ? photos : [PLACEHOLDER];

  return {
    id:          p.id,
    title:       p.title,
    cat:         catFromTags(tags),
    tags:        tags,
    type:        'Пост пользователя',
    author:      authorName,
    biz:         false,
    isUserPost:  true,
    userId:      p.author_id || null,
    locId:       p.location_id || null,
    img:         imgList[0],
    imgs:        imgList,
    desc:        p.content || p.title,
    h:           'medium',
    lat:         p.lat  || 44.7,
    lon:         p.lng  || 38.3,
    apiId:       p.id,
    likesCount:  p.likes_count || 0,
  };
}