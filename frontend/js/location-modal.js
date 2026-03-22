/* ════ LOCATION MODAL ════ */

function openLocModal(locId) {
  const loc = LOCATIONS.find(l => l.id === locId);
  if (!loc) return;

  document.getElementById('lm-img').src          = loc.img;
  document.getElementById('lm-title').textContent = loc.name;
  document.getElementById('lm-type').textContent  = loc.typeLabel;
  document.getElementById('lm-tags').innerHTML    = loc.tags.map(t => `<span class="pill">${t}</span>`).join('');
  document.getElementById('lm-desc').textContent  = loc.desc;

  // Ищем посты по локальному ID (статика) и по UUID из API
  const postsHere = getAllPosts().filter(p => {
    if (p.locId === locId) return true;
    if (p.locId && loc) {
      const matchByCoord = S._apiPosts.find(ap =>
        ap.locId === p.locId &&
        Math.abs(ap.lat - loc.lat) < 0.05 &&
        Math.abs(ap.lon - loc.lon) < 0.05
      );
      if (matchByCoord) return true;
    }
    return false;
  });

  let postsHtml = '';
  if (!postsHere.length) {
    postsHtml = '<div class="loc-no-posts">Пока нет публикаций с этой локации.<br>Будь первым — создай пост!</div>';
  } else {
    postsHere.forEach(p => {
      const isMyPost   = p.isUserPost && S.user && p.userId === (S.user.id || S.user.email);
      const avSrc      = isMyPost && S.user?.avatar ? S.user.avatar : 'https://i.pravatar.cc/32?u=' + p.id;
      const authorName = isMyPost && S.user ? S.user.name : p.author;
      postsHtml += `<div class="loc-post-row" onclick="closeLocModal();openPost('${p.id}')">
        <img src="${p.img}" alt="${p.title}">
        <div class="loc-post-info">
          <div class="loc-post-ttl">${p.title}</div>
          <div class="loc-post-auth"><img src="${avSrc}" alt="">${authorName}</div>
        </div>
      </div>`;
    });
  }
  document.getElementById('lm-posts').innerHTML = postsHtml;

  document.getElementById('loc-modal').classList.add('on');
  document.body.style.overflow = 'hidden';
}

function closeLocModal() {
  document.getElementById('loc-modal').classList.remove('on');
  document.body.style.overflow = '';
}

/* ════ LOCATION SEARCH IN POST FORM ════ */
let _selectedLocId = null;
let _apiLocations  = []; // кэш локаций из бэкенда (с настоящими UUID)

// Загружаем локации из API один раз и кэшируем
async function loadApiLocations() {
  if (_apiLocations.length) return;
  try {
    const res = await apiLocations({ page_size: 100 });
    if (res && Array.isArray(res.items)) {
      _apiLocations = res.items;
    }
  } catch (e) {
    console.warn('Could not load API locations for search:', e.message);
  }
}

const LOC_COLORS_API = {
  winery:   '#8B4513',
  farm:     '#6B8E23',
  glamping: '#4682B4',
  trek:     '#2E8B57',
  gastro:   '#D2691E',
  culture:  '#9370DB',
  spa:      '#20B2AA',
  other:    '#C4603B',
};

function onLocSearch(val) {
  // Подгружаем API-локации (асинхронно, при первом поиске)
  loadApiLocations();

  const dd = document.getElementById('loc-dropdown');
  const q  = (val || '').trim().toLowerCase();

  // Приоритет — локации из API (у них настоящие UUID)
  const apiResults = _apiLocations.filter(l =>
    !q ||
    l.name.toLowerCase().includes(q) ||
    (l.type || '').toLowerCase().includes(q) ||
    (l.address || '').toLowerCase().includes(q)
  );

  // Фоллбэк: статические локации с L-prefix (только если API ничего не вернул)
  const staticResults = apiResults.length === 0
    ? LOCATIONS.filter(l =>
        String(l.id).startsWith('L') &&
        (!q || (l.name || '').toLowerCase().includes(q) || (l.typeLabel || '').toLowerCase().includes(q))
      )
    : [];

  const allResults = [...apiResults, ...staticResults];

  if (!allResults.length) {
    dd.innerHTML = '<div style="padding:12px 14px;font-size:.82rem;color:var(--muted)">Ничего не найдено</div>';
    dd.classList.add('on');
    return;
  }

  dd.innerHTML = allResults.map(l => {
    // API-локация — определяем по наличию поля slug или отсутствию typeLabel
    const isApiLoc = l.slug !== undefined || l.typeLabel === undefined;
    if (isApiLoc) {
      const color = LOC_COLORS_API[l.type] || '#C4603B';
      // Передаём данные через data-атрибут чтобы не было проблем с кавычками в JSON
      const encoded = encodeURIComponent(JSON.stringify(l));
      return `<div class="loc-opt" onclick="selectApiLoc(decodeURIComponent('${encoded}'))">
        <div class="loc-type-dot" style="background:${color}"></div>
        <div>
          <div class="loc-opt-name">${l.name}</div>
          <div class="loc-opt-type">${l.type || ''}</div>
        </div>
      </div>`;
    }
    // Статическая локация (L-prefix, фоллбэк)
    const c = (typeof LOC_COLORS !== 'undefined' && LOC_COLORS[l.type]) || '#C4603B';
    return `<div class="loc-opt" onclick="selectLoc('${l.id}')">
      <div class="loc-type-dot" style="background:${c}"></div>
      <div>
        <div class="loc-opt-name">${l.name}</div>
        <div class="loc-opt-type">${l.typeLabel || ''}</div>
      </div>
    </div>`;
  }).join('');
  dd.classList.add('on');
}

// Выбор локации из API — locJson это строка JSON
function selectApiLoc(locJson) {
  let loc;
  try { loc = JSON.parse(locJson); } catch (e) { console.error('selectApiLoc parse error', e); return; }

  _selectedLocId = loc.id; // настоящий UUID из БД

  document.getElementById('post-loc-id').value      = loc.id;
  document.getElementById('loc-search-input').value = loc.name;
  document.getElementById('loc-dropdown').classList.remove('on');

  const photo = (Array.isArray(loc.photos) && loc.photos[0]) ? loc.photos[0] : '';
  document.getElementById('lsc-img').src         = photo;
  document.getElementById('lsc-name').textContent = loc.name;
  document.getElementById('lsc-type').textContent = loc.type || '';

  document.getElementById('loc-selected-card').classList.add('on');
  document.getElementById('loc-map-divider').style.display    = 'none';
  document.getElementById('post-minimap').style.display       = 'none';
  document.getElementById('post-coord-display').style.display = 'none';

  if (loc.lat) document.getElementById('post-lat').value = loc.lat;
  if (loc.lng) document.getElementById('post-lon').value = loc.lng;
}

// Выбор статической локации (фоллбэк, L-prefix)
function selectLoc(locId) {
  const loc = LOCATIONS.find(l => l.id === locId);
  if (!loc) return;

  _selectedLocId = null; // статические ID не передаём на бэкенд
  document.getElementById('post-loc-id').value      = ''; // не передаём невалидный ID
  document.getElementById('loc-search-input').value = loc.name;
  document.getElementById('loc-dropdown').classList.remove('on');

  document.getElementById('lsc-img').src         = loc.img || '';
  document.getElementById('lsc-name').textContent = loc.name;
  document.getElementById('lsc-type').textContent = loc.typeLabel || '';

  document.getElementById('loc-selected-card').classList.add('on');
  document.getElementById('loc-map-divider').style.display    = 'none';
  document.getElementById('post-minimap').style.display       = 'none';
  document.getElementById('post-coord-display').style.display = 'none';

  document.getElementById('post-lat').value = loc.lat || '';
  document.getElementById('post-lon').value = loc.lon || '';
}

function clearLocSelection() {
  _selectedLocId = null;
  document.getElementById('post-loc-id').value      = '';
  document.getElementById('loc-search-input').value = '';
  document.getElementById('loc-selected-card').classList.remove('on');
  document.getElementById('loc-map-divider').style.display = 'flex';
  document.getElementById('post-minimap').style.display    = 'block';
  document.getElementById('post-lat').value = '';
  document.getElementById('post-lon').value = '';
  clearPostCoord();
}

/* Закрыть дропдаун при клике вне */
document.addEventListener('click', function(e) {
  const dd = document.getElementById('loc-dropdown');
  if (dd && !dd.contains(e.target) && e.target.id !== 'loc-search-input') {
    dd.classList.remove('on');
  }
});
