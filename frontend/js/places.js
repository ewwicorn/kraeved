/* ════ PLACES ════ */

function renderPlaces() {
  const saved = POSTS.filter(p => S.wishlist.includes(p.id));
  // + API-посты
  const savedApi = S._apiPosts.filter(p => S.wishlist.includes(p.id));
  const all = [...savedApi, ...saved];

  document.getElementById('places-cnt').textContent = all.length === 0
    ? 'Нет сохранённых мест'
    : `${all.length} ${all.length===1?'место':all.length<5?'места':'мест'} сохранено`;

  if (!all.length) {
    document.getElementById('places-list').innerHTML = `
      <div class="empty">
        <div class="ico">Места</div>
        <p>Ты ещё не сохранил ни одного места.<br>Листай ленту и сохраняй понравившиеся.</p>
        <br>
        <button class="bp" onclick="go('feed')" style="margin:0 auto;display:flex">Перейти в ленту</button>
      </div>`;
    return;
  }

  document.getElementById('places-list').innerHTML = all.map(p => `
    <div class="prow" onclick="openPost(${JSON.stringify(p.id)})">
      <img src="${p.img}" alt="${p.title}" style="width:88px;object-fit:cover;flex-shrink:0">
      <div class="prow-i">
        <div class="pr-nm">${p.title}</div>
        <div class="pr-tp">${p.type}</div>
        <div class="pr-tgs">${p.tags.slice(0,3).map(t=>`<span class="pill dk">${t}</span>`).join('')}</div>
        <div class="pr-acts">
          <button class="pr-rm" onclick="event.stopPropagation();togSave(${JSON.stringify(p.id)});renderPlaces()">Убрать</button>
          <button class="bp" style="font-size:.74rem;padding:4px 11px" onclick="event.stopPropagation();go('tour-new')">В маршрут</button>
        </div>
      </div>
    </div>`).join('');
}
