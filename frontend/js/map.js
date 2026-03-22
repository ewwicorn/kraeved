/* ════ YANDEX MAPS ════ */

function loadYmaps(cb) {
  if (ymapsLoaded) { ymaps.ready(cb); return; }
  if (document.getElementById('ys')) {
    const wait = setInterval(() => { if (ymapsLoaded) { clearInterval(wait); ymaps.ready(cb); } }, 100);
    return;
  }
  const s = document.createElement('script'); s.id = 'ys';
  s.src = `https://api-maps.yandex.ru/2.1/?lang=ru_RU&apikey=${YANDEX_API_KEY}&load=package.full`;
  s.onload = () => { ymapsLoaded = true; ymaps.ready(cb); };
  document.head.appendChild(s);
}

/* ── Иконки и цвета по location_type ── */
const LOC_TYPE_ICONS = {
  wine:     '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M18 3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v2a9 9 0 0 0 4 7.5V19H8a1 1 0 0 0 0 2h8a1 1 0 0 0 0-2h-2v-6.5A9 9 0 0 0 18 5V3z"/></svg>',
  winery:   '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M18 3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v2a9 9 0 0 0 4 7.5V19H8a1 1 0 0 0 0 2h8a1 1 0 0 0 0-2h-2v-6.5A9 9 0 0 0 18 5V3z"/></svg>',
  mountains:'<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M14 6l-1-2H5v17h2v-7h5l1 2h7V6h-6zm4 8h-4l-1-2H7V6h5l1 2h5v6z"/></svg>',
  mountain: '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M14 6l-1-2H5v17h2v-7h5l1 2h7V6h-6zm4 8h-4l-1-2H7V6h5l1 2h5v6z"/></svg>',
  eco:      '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H7l5-8v4h4l-5 8z"/></svg>',
  waterfall:'<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H7l5-8v4h4l-5 8z"/></svg>',
  track:    '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7"/></svg>',
  farm:     '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M19 9l-7-7-7 7v11h5v-5h4v5h5V9z"/></svg>',
  beach:    '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M13.127 14.56l1.43-1.43 6.44 6.443L19.57 21zm4.293-5.73l2.83-2.829-1.414-1.414-.707.707-1.414-1.414L19 2.988 14.988 7l1.414 1.414-.707.707 1.417 1.419zm-6.413-.73l-4.47-4.47a2 2 0 0 0-2.828 2.829l4.47 4.47a2 2 0 0 0 2.829-2.83z"/></svg>',
  spa:      '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 22c4.97 0 9-4.03 9-9-4.97 0-9 4.03-9 9zm0 0c0-4.97-4.03-9-9-9 0 4.97 4.03 9 9 9zm0-18C9.8 6.14 8 8.33 8 11h8c0-2.67-1.8-4.86-4-5z"/></svg>',
  culture:  '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 3L2 12h3v8h6v-5h2v5h6v-8h3L12 3z"/></svg>',
  gastro:   '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/></svg>',
  default:  '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>',
  other:    '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>',
};

const LOC_TYPE_COLORS = {
  wine:     '#8B3A7A',
  winery:   '#8B3A7A',
  mountains:'#4A6741',
  mountain: '#4A6741',
  eco:      '#2E7D9E',
  waterfall:'#2E7D9E',
  track:    '#4A6741',
  farm:     '#8B6914',
  beach:    '#1565C0',
  spa:      '#6A5ACD',
  culture:  '#B8420A',
  gastro:   '#C4603B',
  default:  '#5A6A7A',
  other:    '#5A6A7A',
};

function getLocIcon(type)  { return LOC_TYPE_ICONS[type]  || LOC_TYPE_ICONS.default; }
function getLocColor(type) { return LOC_TYPE_COLORS[type] || LOC_TYPE_COLORS.default; }

/* ── Полная карта мест ── */
let mapObj = null;

function initFullMap() {
  document.getElementById('map-full').innerHTML = ''; mapObj = null;
  loadYmaps(buildFullMap);
}

async function buildFullMap() {
  mapObj = new ymaps.Map('map-full', { center:[44.7,38.3], zoom:8, controls:['zoomControl'] });
  mapObj.behaviors.disable('scrollZoom');

  // Локации из БД
  try {
    const res = await apiLocations({ page_size: 100 });
    if (res && Array.isArray(res.items)) {
      res.items.forEach(loc => {
        if (!loc.lat || !loc.lng) return;
        addLocPlacemark(loc.lat, loc.lng, loc.name, loc.location_type, () => openApiLocModal(loc));
      });
    }
  } catch (e) {
    console.warn('Could not load API locations for map:', e.message);
  }

  // Пользовательские посты без локации — аватарки
  getAllPosts().forEach(p => {
    if (!p.isUserPost) return;
    if (!p.lat || !p.lon) return;
    if (p.locId) return;
    const isMyPost    = S.user && p.userId === (S.user.id || S.user.email);
    const imgSrc      = p.img || ('https://i.pravatar.cc/42?u=' + p.id);
    const borderColor = isMyPost ? '#7A8C6E' : '#C4603B';
    const layout = ymaps.templateLayoutFactory.createClass(
      '<div title="' + p.title + '" style="'
        + 'width:38px;height:38px;border-radius:8px;border:3px solid ' + borderColor + ';'
        + 'overflow:hidden;cursor:pointer;background:#fff;'
        + 'box-shadow:0 3px 10px rgba(0,0,0,.25);transition:transform .2s;"'
        + ' onmouseover="this.style.transform=\'scale(1.15)\'"'
        + ' onmouseout="this.style.transform=\'scale(1)\'"> '
        + '<img src="' + imgSrc + '" style="width:100%;height:100%;object-fit:cover">'
      + '</div>'
    );
    const pm = new ymaps.Placemark([p.lat, p.lon], {}, {
      iconLayout: layout,
      iconShape: { type:'Rectangle', coordinates:[[0,0],[38,38]] },
    });
    pm.events.add('click', () => openPost(p.id));
    mapObj.geoObjects.add(pm);
  });
}

function addLocPlacemark(lat, lon, name, type, onClick) {
  const color  = getLocColor(type);
  const icon   = getLocIcon(type);
  const layout = ymaps.templateLayoutFactory.createClass(
    '<div title="' + name + '" style="'
      + 'width:40px;height:40px;border-radius:50%;background:' + color + ';'
      + 'display:flex;align-items:center;justify-content:center;'
      + 'cursor:pointer;box-shadow:0 3px 12px rgba(0,0,0,.3);'
      + 'border:2.5px solid #fff;transition:transform .2s;color:#fff;"'
      + ' onmouseover="this.style.transform=\'scale(1.18)\'"'
      + ' onmouseout="this.style.transform=\'scale(1)\'"> '
      + icon
    + '</div>'
  );
  const pm = new ymaps.Placemark([lat, lon], {}, {
    iconLayout: layout,
    iconShape: { type:'Circle', coordinates:[20,20], radius:20 },
  });
  pm.events.add('click', onClick);
  mapObj.geoObjects.add(pm);
}

function openApiLocModal(loc) {
  const photo = (Array.isArray(loc.photos) && loc.photos[0]) ? loc.photos[0] : '';

  document.getElementById('lm-img').src           = photo;
  document.getElementById('lm-title').textContent = loc.name;
  document.getElementById('lm-type').textContent  = loc.location_type || loc.type || '';
  document.getElementById('lm-tags').innerHTML    = (Array.isArray(loc.tags) ? loc.tags : [])
    .map(t => `<span class="pill">${typeof t === 'object' ? (t.label_ru || t.slug || '') : t}</span>`).join('');

  let descHtml = loc.description || '';
  if (loc.address)         descHtml += `<div style="margin-top:8px;font-size:.82rem;color:#7a6e65">📍 ${loc.address}</div>`;
  if (loc.price_from)      descHtml += `<div style="margin-top:4px;font-size:.82rem;color:#c4603b;font-weight:600">от ${loc.price_from} ₽</div>`;
  if (loc.contact_phone)   descHtml += `<div style="margin-top:4px;font-size:.82rem;color:#7a6e65">📞 ${loc.contact_phone}</div>`;
  if (loc.contact_website) descHtml += `<div style="margin-top:4px;font-size:.82rem"><a href="${loc.contact_website}" target="_blank" style="color:#c4603b">${loc.contact_website}</a></div>`;
  document.getElementById('lm-desc').innerHTML = descHtml;

  const postsHere = S._apiPosts.filter(p => p.locId === loc.id);
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

/* ── Карта тура ── */
let tourMap = null;

function sortedPts() { return [...S.tourPts].sort((a,b) => a.day !== b.day ? a.day - b.day : a.ord - b.ord); }

function initTourMap() {
  document.getElementById('ymap').innerHTML = ''; tourMap = null;
  loadYmaps(buildTourMap);
}

function buildTourMap() {
  const pts = sortedPts();
  tourMap = new ymaps.Map('ymap', {
    center: [pts[0].lat, pts[0].lon], zoom: 9,
    controls: ['zoomControl','geolocationControl'],
  });
  tourMap.behaviors.disable('scrollZoom');
  drawRoute(pts);
}

function drawRoute(pts) {
  if (!tourMap) return;
  tourMap.geoObjects.removeAll();
  const waypoints   = pts.map(p => [p.lat, p.lon]);
  const routingMode = S.transport === 'car' ? 'auto' : 'masstransit';

  showRouteStatus(`Строим маршрут (${routingMode === 'auto' ? 'на машине' : 'общественный транспорт'})...`);

  ymaps.route(waypoints, { routingMode, mapStateAutoApply: false,
    ...(routingMode === 'auto' ? { avoidTrafficJams: true } : {}),
  }).then(route => {
    hideRouteStatus();
    const paths = route.getPaths();
    paths.each(path => {
      path.getSegments().each(seg => {
        seg.options.set({ strokeColor: '#C4603B', strokeWidth: 4, strokeOpacity: .8,
          ...(routingMode === 'masstransit' ? { strokeStyle: 'dot' } : {}),
        });
      });
    });
    tourMap.geoObjects.add(route);
    pts.forEach((p, i) => {
      const pm = new ymaps.Placemark([p.lat, p.lon],
        { balloonContent: `<strong>${p.n}</strong><br><span style="color:#7A6E65;font-size:12px">${p.type}</span>` },
        { preset: 'islands#redStretchyIcon', iconColor: '#C4603B', iconContent: i + 1 }
      );
      tourMap.geoObjects.add(pm);
    });
    const bounds = tourMap.geoObjects.getBounds();
    if (bounds) tourMap.setBounds(bounds, { checkZoomRange: true, zoomMargin: 60 });
    const totalTime = route.getJamsTime ? route.getJamsTime() : route.getTime();
    if (totalTime) {
      const mins = Math.round(totalTime / 60);
      toast(`Маршрут построен · ${mins > 60 ? Math.floor(mins/60)+'ч '+mins%60+'мин' : mins+' мин'} в пути`);
    }
  }).catch(err => {
    console.warn('Routing failed, fallback to polyline:', err);
    hideRouteStatus();
    const poly = new ymaps.Polyline(pts.map(p => [p.lat,p.lon]), {},
      { strokeColor:'#C4603B', strokeWidth:4, strokeOpacity:.65, strokeStyle:'dash' });
    tourMap.geoObjects.add(poly);
    pts.forEach((p, i) => {
      const pm = new ymaps.Placemark([p.lat,p.lon],
        { balloonContent: `<strong>${p.n}</strong>` },
        { preset:'islands#redStretchyIcon', iconColor:'#C4603B', iconContent: i+1 });
      tourMap.geoObjects.add(pm);
    });
    const bounds = tourMap.geoObjects.getBounds();
    if (bounds) tourMap.setBounds(bounds, { checkZoomRange: true, zoomMargin: 60 });
  });
}

function showRouteStatus(msg) { const el = document.getElementById('route-status'); if (el) { el.textContent = msg; el.classList.add('on'); } }
function hideRouteStatus()    { const el = document.getElementById('route-status'); if (el) el.classList.remove('on'); }
