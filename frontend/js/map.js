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

/* ── Полная карта мест ── */
let mapObj = null;

function initFullMap() {
  document.getElementById('map-full').innerHTML = ''; mapObj = null;
  loadYmaps(buildFullMap);
}

async function buildFullMap() {
  mapObj = new ymaps.Map('map-full', { center:[44.7,38.3], zoom:8, controls:['zoomControl'] });
  mapObj.behaviors.disable('scrollZoom');

  // Статические локации (заглушки из data.js)
  LOCATIONS.forEach(loc => {
    addLocPlacemark(
      loc.lat, loc.lon, loc.name, loc.type,
      () => { if (typeof openLocModal === 'function') openLocModal(loc.id); }
    );
  });

  // Локации из БД
  try {
    const res = await apiLocations({ page_size: 100 });
    if (res && Array.isArray(res.items)) {
      res.items.forEach(loc => {
        if (!loc.lat || !loc.lng) return;
        addLocPlacemark(
          loc.lat, loc.lng, loc.name, loc.type,
          () => openApiLocModal(loc)
        );
      });
    }
  } catch (e) {
    console.warn('Could not load API locations for map:', e.message);
  }

  // Пользовательские посты — аватарки
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

/* Добавляет цветной пин локации на карту */
function addLocPlacemark(lat, lon, name, type, onClick) {
  const color  = LOC_COLORS[type] || '#C4603B';
  const icon   = LOC_ICONS[type]  || LOC_ICONS.culture;
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

/* Открывает стандартный loc-modal для API-локации */
function openApiLocModal(loc) {
  const photo = (Array.isArray(loc.photos) && loc.photos[0]) ? loc.photos[0] : '';

  document.getElementById('lm-img').src           = photo;
  document.getElementById('lm-title').textContent = loc.name;
  document.getElementById('lm-type').textContent  = loc.type || '';
  document.getElementById('lm-tags').innerHTML    = (Array.isArray(loc.tags) ? loc.tags : [])
    .map(t => `<span class="pill">${typeof t === 'object' ? (t.label_ru || t.slug || '') : t}</span>`).join('');

  // Описание + практическая информация
  let descHtml = loc.description || '';
  if (loc.address)   descHtml += `<div style="margin-top:8px;font-size:.82rem;color:#7a6e65">📍 ${loc.address}</div>`;
  if (loc.price_from) descHtml += `<div style="margin-top:4px;font-size:.82rem;color:#c4603b;font-weight:600">от ${loc.price_from} ₽</div>`;
  if (loc.contact_phone)   descHtml += `<div style="margin-top:4px;font-size:.82rem;color:#7a6e65">📞 ${loc.contact_phone}</div>`;
  if (loc.contact_website) descHtml += `<div style="margin-top:4px;font-size:.82rem"><a href="${loc.contact_website}" target="_blank" style="color:#c4603b">${loc.contact_website}</a></div>`;
  document.getElementById('lm-desc').innerHTML = descHtml;

  // Связанные посты из API
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
        seg.options.set({
          strokeColor: '#C4603B', strokeWidth: 4, strokeOpacity: .8,
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
