/* ════ LOCATION MODAL ════ */

/* Открывает модал для API-локации по UUID */
function openLocModal(locId) {
  // Поищем среди API-постов — там может быть привязка к локации
  // Для статических L-prefix ID просто игнорируем (их больше нет)
  if (!locId) return;
  console.warn('openLocModal called with id:', locId, '— use openApiLocModal instead');
}

function closeLocModal() {
  document.getElementById('loc-modal').classList.remove('on');
  document.body.style.overflow = '';
}

/* ════ LOCATION SEARCH IN POST FORM ════ */
let _selectedLocId = null;
let _apiLocations  = [];

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
  winery:'#8B3A7A', waterfall:'#2E7D9E', mountain:'#4A6741',
  farm:'#8B6914', beach:'#1565C0', spa:'#6A5ACD', culture:'#B8420A',
  gastro:'#C4603B', other:'#5A6A7A',
};

function onLocSearch(val) {
  loadApiLocations();

  const dd = document.getElementById('loc-dropdown');
  const q  = (val || '').trim().toLowerCase();

  const results = _apiLocations.filter(l =>
    !q ||
    l.name.toLowerCase().includes(q) ||
    (l.type || '').toLowerCase().includes(q) ||
    (l.address || '').toLowerCase().includes(q)
  );

  if (!results.length) {
    dd.innerHTML = '<div style="padding:12px 14px;font-size:.82rem;color:var(--muted)">Ничего не найдено</div>';
    dd.classList.add('on');
    return;
  }

  dd.innerHTML = results.map(l => {
    const color   = LOC_COLORS_API[l.type] || '#C4603B';
    const encoded = encodeURIComponent(JSON.stringify(l));
    return `<div class="loc-opt" onclick="selectApiLoc(decodeURIComponent('${encoded}'))">
      <div class="loc-type-dot" style="background:${color}"></div>
      <div>
        <div class="loc-opt-name">${l.name}</div>
        <div class="loc-opt-type">${l.type || ''}</div>
      </div>
    </div>`;
  }).join('');
  dd.classList.add('on');
}

function selectApiLoc(locJson) {
  let loc;
  try { loc = JSON.parse(locJson); } catch (e) { console.error('selectApiLoc parse error', e); return; }

  _selectedLocId = loc.id;

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

// Оставлен для совместимости — больше не вызывается
function selectLoc(locId) {
  console.warn('selectLoc called with static id', locId, '— no static locations anymore');
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

document.addEventListener('click', function(e) {
  const dd = document.getElementById('loc-dropdown');
  if (dd && !dd.contains(e.target) && e.target.id !== 'loc-search-input') {
    dd.classList.remove('on');
  }
});
