/* ════ FEED ════ */

function renderFilters() {
  const cats = [
    {k:'all',l:'Все'},{k:'gastro',l:'Гастро'},{k:'wine',l:'Вино'},
    {k:'nature',l:'Природа'},{k:'active',l:'Активный'},
    {k:'culture',l:'Культурный'},{k:'wellness',l:'Релакс'},
  ];
  document.getElementById('ffilters').innerHTML = cats.map(c =>
    `<span class="pf ${S.feedCat === c.k ? 'on' : ''}" onclick="setCat('${c.k}')">${c.l}</span>`
  ).join('');
}

function setCat(c) { S.feedCat = c; S.feedLoaded = 15; renderFilters(); renderMasonry(); }

function renderMasonry() {
  const allPosts  = getAllPosts();
  const filtered  = S.feedCat === 'all' ? allPosts : allPosts.filter(p => p.cat === S.feedCat);
  const vis       = filtered.slice(0, S.feedLoaded);
  const hm        = { tall: 'aspect-ratio:3/4', medium: 'aspect-ratio:4/5', short: 'aspect-ratio:1/1' };

  let html = '';

  if (S.interactions >= 3 && S.loggedIn) {
    html += `<div class="smart-b">
      <div class="sbt">
        <strong>Сохранил ${S.interactions} ${S.interactions === 1 ? 'место' : S.interactions < 5 ? 'места' : 'мест'}</strong>
        <span>Самое время создать маршрут</span>
      </div>
      <button class="sbtn" onclick="go('tour-new')">Создать тур</button>
    </div>`;
  }

  html += vis.map(p => {
    const isMyPost  = p.isUserPost && S.user && p.userId === (S.user.id || S.user.email);
    const avSrc     = isMyPost && S.user?.avatar
      ? S.user.avatar
      : 'https://i.pravatar.cc/40?u=' + p.id;
    const authorLabel = isMyPost ? (S.user?.name || p.author) : p.author;
    const badge = p.biz
      ? '<span class="pill" style="font-size:.62rem;padding:2px 6px">Место</span>'
      : isMyPost
        ? '<span class="pill" style="font-size:.62rem;padding:2px 6px;background:rgba(122,140,110,.12);color:var(--sage)">Мой пост</span>'
        : '';

    return `<div class="mc" onclick="openPost('${p.id}')">
      <img src="${p.img}" alt="${p.title}" style="${hm[p.h] || 'aspect-ratio:4/5'}" loading="lazy">
      <button class="csave ${S.wishlist.includes(p.id) ? 'sv' : ''}"
        onclick="event.stopPropagation();togSave('${p.id}')" title="Сохранить">
        ${S.wishlist.includes(p.id) ? '&#10084;' : '&#9825;'}
      </button>
      <div class="mci">
        <div class="mct">${p.title}</div>
        <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:5px">
          ${p.tags.slice(0, 2).map(t => `<span class="pill dk">${t}</span>`).join('')}
        </div>
        <div class="mca">
          <img src="${avSrc}" alt="${authorLabel}">
          <span>${authorLabel}</span>
          ${badge}
        </div>
      </div>
    </div>`;
  }).join('');

  document.getElementById('masonry').innerHTML = html;
}

function togSave(id) {
  const i = S.wishlist.indexOf(id);
  if (i === -1) {
    S.wishlist.push(id);
    if (!S._savedOnce[id]) { S.interactions++; S._savedOnce[id] = true; }
    saveS(); renderMasonry(); toast('Место сохранено');
    // Лайк в API если пост оттуда
    const p = getAllPosts().find(x => x.id === id);
    if (p && p.apiId) apiLikePost(p.apiId).catch(() => {});
  } else {
    S.wishlist.splice(i, 1);
    saveS(); renderMasonry(); toast('Убрано из сохранённых');
  }
}

function loadMore() { S.feedLoaded += 8; renderMasonry(); }

/* Загрузить посты и перерисовать ленту */
async function initFeed() {
  await loadApiPosts();
  renderFilters();
  renderMasonry();
}