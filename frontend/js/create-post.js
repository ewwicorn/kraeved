/* ════ CREATE POST MODAL ════ */

let _postImgFile    = null;
let _postImgDataUrl = null;
let _postMap        = null;
let _postMarker     = null;

/* ── Теги из API ── */
let _createTags = [];

async function loadCreateTags() {
  if (_createTags.length) return;
  try {
    const res = await apiLocationTags();
    if (Array.isArray(res)) _createTags = res;
  } catch (e) {
    console.warn('Could not load tags for create form:', e.message);
  }
}

function renderCreateTags() {
  const wrap = document.getElementById('create-tags');
  if (!wrap) return;
  if (!_createTags.length) return; // оставить статические как фоллбэк

  // Сохраняем ранее выбранные теги
  const selected = new Set(
    [...wrap.querySelectorAll('.create-tag.on')].map(el => el.dataset.tag)
  );

  wrap.innerHTML = _createTags.map(t =>
    `<span class="create-tag ${selected.has(t.label_ru) ? 'on' : ''}" data-tag="${t.label_ru}" onclick="toggleCreateTag(this)">${t.label_ru}</span>`
  ).join('');
}

function openCreatePost() {
  if (!S.loggedIn) { go('auth'); return; }

  _postImgFile = null; _postImgDataUrl = null;

  document.getElementById('post-title').value = '';
  document.getElementById('post-desc').value  = '';
  document.getElementById('post-lat').value   = '';
  document.getElementById('post-lon').value   = '';

  const cd = document.getElementById('post-coord-display');
  if (cd) cd.style.display = 'none';

  _selectedLocId = null;
  const lsi = document.getElementById('loc-search-input'); if (lsi) lsi.value = '';
  const lsc = document.getElementById('loc-selected-card'); if (lsc) lsc.classList.remove('on');
  const lmd = document.getElementById('loc-map-divider');  if (lmd) lmd.style.display = 'flex';
  const pmm = document.getElementById('post-minimap');     if (pmm) pmm.style.display = 'block';
  const lid = document.getElementById('post-loc-id');      if (lid) lid.value = '';

  document.getElementById('post-success').classList.remove('on');
  document.getElementById('post-submit-btn').disabled    = false;
  document.getElementById('post-submit-btn').textContent = 'Опубликовать';

  // Сбрасываем теги
  document.querySelectorAll('.create-tag').forEach(t => t.classList.remove('on'));

  const area = document.getElementById('img-upload-area');
  area.classList.remove('has-img');
  area.innerHTML = `<div class="upload-hint"><strong>Выберите фото</strong>Нажмите, чтобы загрузить</div><div class="img-upload-overlay"><span>Изменить фото</span></div>`;
  area.onclick = () => document.getElementById('post-file').click();

  document.getElementById('create-modal').classList.add('on');
  document.body.style.overflow = 'hidden';
  setTimeout(initPostMiniMap, 100);

  // Загружаем теги и локации из API
  if (typeof loadApiLocations === 'function') loadApiLocations();
  loadCreateTags().then(renderCreateTags);
}

function closeCreatePost() {
  document.getElementById('create-modal').classList.remove('on');
  document.body.style.overflow = '';
  if (_postMap) { _postMap.destroy(); _postMap = null; _postMarker = null; }
}

function onPostFileChange(input) {
  const file = input.files[0]; if (!file) return;
  _postImgFile = file;
  const reader = new FileReader();
  reader.onload = e => {
    _postImgDataUrl = e.target.result;
    const area = document.getElementById('img-upload-area');
    area.classList.add('has-img');
    area.innerHTML = `<img src="${_postImgDataUrl}" alt="preview"><div class="img-upload-overlay"><span>Изменить фото</span></div>`;
    area.onclick = () => document.getElementById('post-file').click();
  };
  reader.readAsDataURL(file);
  input.value = '';
}

function toggleCreateTag(el) { el.classList.toggle('on'); }

function isValidUUID(str) {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

async function submitPost() {
  const title = document.getElementById('post-title').value.trim();
  const desc  = document.getElementById('post-desc').value.trim();
  const lat   = parseFloat(document.getElementById('post-lat').value) || 44.7;
  const lon   = parseFloat(document.getElementById('post-lon').value) || 38.3;
  const tags  = [...document.querySelectorAll('.create-tag.on')].map(t => t.dataset.tag);

  if (!title) { document.getElementById('post-title').focus(); toast('Введите название места'); return; }
  if (!_postImgDataUrl) { toast('Добавьте фото'); return; }

  const btn = document.getElementById('post-submit-btn');
  btn.disabled = true; btn.textContent = 'Публикуется...';

  const locId     = document.getElementById('post-loc-id').value || null;
  const validLocId = isValidUUID(locId) ? locId : null;
  const knownLoc  = locId ? LOCATIONS.find(l => l.id === locId) : null;

  let photoUrl = _postImgDataUrl;

  if (_postImgFile && localStorage.getItem('kv_token')) {
    try {
      const uploadRes = await apiUploadFile(_postImgFile);
      if (uploadRes && uploadRes.url && isAbsoluteUrl(uploadRes.url)) {
        photoUrl = uploadRes.url;
      } else if (uploadRes && uploadRes.object_name) {
        try {
          const urlRes = await apiFileUrl(encodeURIComponent(uploadRes.object_name));
          if (urlRes && urlRes.url) photoUrl = urlRes.url;
        } catch (urlErr) {
          console.warn('apiFileUrl failed, keeping base64:', urlErr.message);
        }
      }
    } catch (e) {
      console.warn('File upload failed, using base64:', e.message);
    }
  }

  let savedAsApiPost = false;
  if (localStorage.getItem('kv_token')) {
    try {
      const postData = {
        title:       knownLoc ? knownLoc.name : title,
        content:     desc || (knownLoc ? knownLoc.desc : title),
        photos:      photoUrl ? [photoUrl] : [],
        tags:        tags.length ? tags : (knownLoc ? knownLoc.tags : []),
        location_id: validLocId,
        lat,
        lng:         lon,
      };
      const created = await apiCreatePost(postData);
      const mapped  = mapApiPost(created);
      await resolvePostPhotos([mapped]);
      S._apiPosts.unshift(mapped);
      savedAsApiPost = true;
    } catch (e) {
      console.warn('API post creation failed, saving locally', e.message || e);
    }
  }

  if (!savedAsApiPost) {
    const up = getUserPostsLocal();
    const newPost = {
      id:         Date.now(),
      title:      knownLoc ? knownLoc.name : title,
      cat:        catFromTags(tags.length ? tags : (knownLoc ? knownLoc.tags : [])),
      tags:       tags.length ? tags : (knownLoc ? knownLoc.tags : []),
      type:       knownLoc ? knownLoc.typeLabel : 'Пост пользователя',
      author:     S.user.name,
      biz:        false,
      isUserPost: true,
      userId:     S.user.id || S.user.email,
      locId:      validLocId || null,
      img:        photoUrl,
      imgs:       [photoUrl],
      desc:       desc || (knownLoc ? knownLoc.desc : title),
      h:          'medium',
      lat, lon,
      createdAt:  Date.now(),
    };
    up.push(newPost);
    saveUserPostsLocal(up);
    S._apiPosts.unshift(newPost);
  }

  setTimeout(() => {
    btn.textContent = 'Опубликовано';
    document.getElementById('post-success').classList.add('on');
    setTimeout(() => {
      closeCreatePost();
      go('feed');
      toast('Пост опубликован');
    }, 1200);
  }, 800);
}

function getUserPostsLocal() { try { return JSON.parse(localStorage.getItem('kv_posts') || '[]'); } catch { return []; } }
function saveUserPostsLocal(p) { try { localStorage.setItem('kv_posts', JSON.stringify(p)); } catch {} }

function initPostMiniMap() {
  if (!window.ymaps) { loadYmaps(initPostMiniMap); return; }
  const container = document.getElementById('post-minimap'); if (!container) return;
  const hint = document.getElementById('minimap-hint'); if (hint) hint.style.display = 'none';
  ymaps.ready(() => {
    if (_postMap) { _postMap.destroy(); _postMap = null; _postMarker = null; }
    _postMap = new ymaps.Map('post-minimap', { center:[44.7,38.3], zoom:8, controls:['zoomControl','searchControl'] });
    _postMap.events.add('click', e => {
      const coords = e.get('coords');
      setPostCoord(coords[0], coords[1]);
    });
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        if (_postMap) _postMap.setCenter([pos.coords.latitude, pos.coords.longitude], 12);
      }, () => {});
    }
  });
}

function setPostCoord(lat, lon) {
  document.getElementById('post-lat').value = lat;
  document.getElementById('post-lon').value = lon;
  const display = document.getElementById('post-coord-display');
  const text    = document.getElementById('post-coord-text');
  if (display) display.style.display = 'flex';
  if (text)    text.textContent = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
  if (!_postMap) return;
  if (_postMarker) _postMap.geoObjects.remove(_postMarker);
  _postMarker = new ymaps.Placemark([lat, lon], {}, { preset:'islands#redDotIcon', iconColor:'#C4603B' });
  _postMap.geoObjects.add(_postMarker);
  _postMap.panTo([lat, lon], {duration: 300});
}

function clearPostCoord() {
  document.getElementById('post-lat').value = '';
  document.getElementById('post-lon').value = '';
  const display = document.getElementById('post-coord-display');
  if (display) display.style.display = 'none';
  if (_postMarker && _postMap) { _postMap.geoObjects.remove(_postMarker); _postMarker = null; }
}
