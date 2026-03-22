/* ════ TOUR FORM ════ */

function renderSpPrev() {
  const saved = getAllPosts().filter(p => S.wishlist.includes(p.id));
  const prev  = document.getElementById('sp-prev');
  const cnt   = document.getElementById('sp-count');
  if (!saved.length) {
    if (prev) prev.innerHTML = '<span style="font-size:.78rem;color:var(--muted)">Нет сохранённых мест</span>';
    if (cnt)  cnt.textContent = '';
    return;
  }
  if (prev) prev.innerHTML = saved.slice(0, 3).map(p =>
    `<div class="sp-chip"><img src="${p.img}" alt="${p.title}"><span>${p.title}</span></div>`
  ).join('');
  if (cnt) cnt.textContent = `${saved.length} ${saved.length===1?'место':saved.length<5?'места':'мест'} будут учтены при генерации`;
}

function selGrp(el) {
  document.querySelectorAll('#grp-pills .pt').forEach(p => p.classList.remove('on'));
  el.classList.add('on'); S.group = el.dataset.g;
  document.getElementById('child-age').style.display = el.dataset.g === 'family' ? 'block' : 'none';
}

function selTrans(t) {
  S.transport = t;
  document.getElementById('tc-car').classList.toggle('on', t === 'car');
  document.getElementById('tc-pub').classList.toggle('on', t === 'public');
}

function togChip(el) {
  el.classList.toggle('on');
  const a = el.dataset.a, arr = S.acts, i = arr.indexOf(a);
  if (i === -1) arr.push(a); else arr.splice(i, 1);
}

function onBudget(el) {
  const v = parseInt(el.value); S.budget = v;
  document.getElementById('bcur').textContent = 'до ' + v.toLocaleString('ru') + ' ₽';
  document.getElementById('bfill').style.width = ((v - 3000) / (50000 - 3000) * 100) + '%';
}

const LMSGS = [
  'Анализируем предпочтения...','Подбираем лучшие локации...',
  'Проверяем погоду на даты...','Строим оптимальный маршрут...',
  'Ищем жильё рядом с маршрутом...','Финальные штрихи...',
];

function generateTour() {
  const btn = document.getElementById('gen-btn');
  btn.classList.add('loading');
  document.getElementById('gen-lbl').textContent = 'Строим маршрут...';
  document.getElementById('loader').classList.add('on');
  let i = 0;
  const t = setInterval(() => { document.getElementById('ltxt').textContent = LMSGS[i % LMSGS.length]; i++; }, 2000);
  setTimeout(() => {
    clearInterval(t);
    document.getElementById('loader').classList.remove('on');
    btn.classList.remove('loading');
    document.getElementById('gen-lbl').textContent = 'Создать маршрут';
    S.tourPts = BASE_TOUR.map(p => ({...p}));
    go('tour-result');
  }, 11000);
}

/* ════ TOUR RESULT ════ */

function renderTourResult() {
  if (!S.tourPts.length) S.tourPts = BASE_TOUR.map(p => ({...p}));
  const byDay = {};
  S.tourPts.forEach(p => { if (!byDay[p.day]) byDay[p.day] = []; byDay[p.day].push(p); });
  const modeLabel = S.transport === 'car' ? 'На машине' : 'Без машины';

  let html = `
    <div style="margin-bottom:16px">
      <div class="ttitle">Маршрут${S.user ? ' ' + (S.user.name||'').split(' ')[0] + 'а' : ''}</div>
      <div class="tmeta">
        <span class="tmi">10–13 мая 2026</span>
        <span class="tmi" style="background:rgba(28,20,16,.05);border-radius:100px;padding:3px 10px">от 18 000 ₽/чел</span>
        <span class="tmi" style="background:rgba(28,20,16,.05);border-radius:100px;padding:3px 10px">${S.tourPts.length} точек</span>
      </div>
      <div class="transport-badge">${modeLabel}</div>
      <div id="route-status" class="route-status"></div>
      <div class="wstrip">
        ${[{d:'10.05',i:'ясно',t:'+22'},{d:'11.05',i:'облачно',t:'+19'},{d:'12.05',i:'ясно',t:'+24'},{d:'13.05',i:'ясно',t:'+21'}]
          .map(w => `<div class="wday"><div style="font-size:.7rem;color:var(--muted)">${w.i}</div><div class="wt">${w.t}°</div><div>${w.d}</div></div>`)
          .join('')}
      </div>
    </div>`;

  for (const [day, pts] of Object.entries(byDay)) {
    html += `<div class="dlbl">День ${day}</div>`;
    pts.forEach(p => {
      const tagsJson = JSON.stringify(p.tags);
      html += `<div class="tpc" id="tpc-${p.day}-${p.ord}">
        <img class="tpc-img" src="${p.img}" alt="${p.n}" loading="lazy"
          onclick="openVid('${p.n}',['${p.img}'],${tagsJson},'${p.url}')">
        <div class="tpc-b">
          <div class="tpc-nm">${p.n}</div>
          <div class="tpc-tp">${p.type}</div>
          <div class="tpc-tgs">${p.tags.map(t => `<span class="pill">${t}</span>`).join('')}</div>
          <div class="tpc-why">${p.why}</div>
          <div class="tpc-time">
            <span>${p.arrive}</span>
            ${p.drive > 0 ? `<span>${p.drive} мин от предыдущей</span>` : ''}
          </div>
          <div class="tpc-acts">
            <button class="bswap" onclick="swapPoint(${p.day},${p.ord})">Заменить</button>
            <button class="bvid" onclick="openVid('${p.n}',['${p.img}'],${tagsJson},'${p.url}')">Видео-визит</button>
          </div>
        </div>
      </div>`;
    });
  }

  html += `<div class="hotels-b" id="hotels-b">
    <h3>Где остановиться</h3>
    ${HOTELS.map(h =>
      `<a class="hcard" href="${h.url}" target="_blank">
        <img src="${h.img}" alt="${h.n}">
        <div class="hcard-i">
          <div class="hcard-nm">${h.n}</div>
          <div class="hcard-p">${h.p}</div>
          <div class="hcard-r">${h.r} из 5</div>
        </div>
      </a>`
    ).join('')}
  </div>`;

  document.getElementById('tlist').innerHTML = html;
  initTourMap();
}

function swapPoint(day, ord) {
  const cand = SWAP_POOL[S.swapIdx % SWAP_POOL.length]; S.swapIdx++;
  const idx  = S.tourPts.findIndex(p => p.day === day && p.ord === ord);
  if (idx === -1) return;
  S.tourPts[idx] = {...S.tourPts[idx], ...cand, day, ord};
  const card = document.getElementById(`tpc-${day}-${ord}`);
  if (card) {
    card.style.cssText = 'opacity:0;transform:scale(.95);transition:all .26s';
    setTimeout(() => {
      card.querySelector('.tpc-img').src             = cand.img;
      card.querySelector('.tpc-nm').textContent       = cand.n;
      card.querySelector('.tpc-tp').textContent       = cand.type;
      card.querySelector('.tpc-tgs').innerHTML        = cand.tags.map(t => `<span class="pill">${t}</span>`).join('');
      card.querySelector('.tpc-why').textContent      = cand.why;
      card.style.cssText = 'opacity:1;transform:scale(1);transition:all .26s';
      drawRoute(sortedPts());
    }, 260);
  }
}

function scrollHotels() { const el = document.getElementById('hotels-b'); if (el) el.scrollIntoView({behavior:'smooth',block:'start'}); }

function openNav() {
  const pts = sortedPts();
  if (!pts.length) { toast('Нет точек маршрута'); return; }
  const first = pts[0], last = pts[pts.length - 1];
  const navUrl = `yandexnavi://build_route_on_map?lat_from=${first.lat}&lon_from=${first.lon}&lat_to=${last.lat}&lon_to=${last.lon}`;
  const webUrl = `https://yandex.ru/maps/?rtext=${pts.map(p=>`${p.lat},${p.lon}`).join('~')}&rtt=auto`;
  const start = Date.now();
  window.location.href = navUrl;
  setTimeout(() => { if (Date.now() - start < 2000) window.open(webUrl, '_blank'); }, 1500);
  toast('Открываем маршрут...');
}

function shareTour() {
  const url = location.href + '#tour';
  navigator.clipboard?.writeText(url).then(() => toast('Ссылка скопирована')).catch(() => toast('Ссылка скопирована'));
  if (!navigator.clipboard) toast('Ссылка скопирована');
}
