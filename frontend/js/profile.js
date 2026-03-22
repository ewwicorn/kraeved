/* ════ PROFILE ════ */

function renderProfile() {
  const wrap = document.getElementById('prw');
  if (!S.loggedIn || !S.user) {
    wrap.innerHTML = `
      <div style="text-align:center;padding:76px 24px">
        <h3 style="margin-bottom:7px">Войди, чтобы видеть профиль</h3>
        <p style="color:var(--muted);margin-bottom:22px;font-size:.88rem">
          Здесь будут твоя статистика, предпочтения и история туров.
        </p>
        <button class="bp" onclick="go('auth')">Войти / Зарегистрироваться</button>
      </div>`;
    return;
  }
  const u = S.user;

  // Мои посты — из API и локального хранилища
  const myPosts = getAllPosts().filter(p =>
    p.isUserPost && p.userId && String(p.userId) === String(u.id || u.email)
  );

  // Вкусовой профиль — считаем по тегам постов и сохранённых мест
  const allMyContent = [
    ...myPosts,
    ...getAllPosts().filter(p => S.wishlist.includes(p.id))
  ];
  const catCount = {};
  allMyContent.forEach(p => {
    const cat = p.cat || 'nature';
    catCount[cat] = (catCount[cat] || 0) + 1;
  });
  const catLabels = {wine:'Вино', gastro:'Гастро', nature:'Природа', active:'Активный', wellness:'Релакс', culture:'Культурный'};
  const total = Math.max(Object.values(catCount).reduce((a,b)=>a+b,0), 1);
  const vec = Object.entries(catLabels).map(([k,t]) => ({t, v: (catCount[k]||0)/total}));
  const hasVec = vec.some(v => v.v > 0);
  const vecHtml = hasVec
    ? vec.filter(v=>v.v>0).sort((a,b)=>b.v-a.v).map(v =>
        `<div class="vp"><span>${v.t}</span>
          <div class="vbar"><div class="vfill" style="width:${Math.round(v.v*100)}%"></div></div>
          <span style="font-size:.73rem;color:var(--muted)">${Math.round(v.v*100)}%</span>
        </div>`
      ).join('')
    : '<div style="color:var(--muted);font-size:.85rem;padding:8px 0">Сохраняй места и создавай посты — здесь появится твой вкусовой профиль</div>';

  // Теги из постов пользователя
  const tagSet = new Set();
  myPosts.forEach(p => p.tags?.slice(0,2).forEach(t => tagSet.add(t)));
  const userTags = [...tagSet].slice(0, 5);
  const tagsHtml = userTags.length
    ? userTags.map(t => `<span class="pill">${t}</span>`).join('')
    : '<span class="pill">Путешественник</span>';

  // Посты
  let postsHtml = '';
  if (!myPosts.length) {
    postsHtml = `<div style="text-align:center;padding:28px 0;color:var(--muted);font-size:.88rem">
      <div style="font-style:italic;font-size:1.1rem;color:var(--terra);margin-bottom:8px">Нет публикаций</div>
      Поделись интересным местом — оно появится здесь, в ленте и на карте.
      <br>
      <button class="bp" onclick="go('feed');setTimeout(openCreatePost,100)"
        style="margin:16px auto 0;display:flex;font-size:.82rem;padding:9px 20px">Создать пост</button>
    </div>`;
  } else {
    postsHtml = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:9px">';
    myPosts.slice(0, 9).forEach(p => {
      const imgSrc = p.img || 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=300&q=80';
      postsHtml += `<div style="border-radius:var(--rs);overflow:hidden;cursor:pointer;aspect-ratio:1;position:relative" onclick="openPost('${p.id}')">
        <img src="${imgSrc}" style="width:100%;height:100%;object-fit:cover;display:block" loading="lazy">
        <div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(to top,rgba(28,20,16,.65),transparent);padding:5px 7px;font-size:.68rem;color:#fff;font-weight:600;line-height:1.2">${p.title}</div>
      </div>`;
    });
    postsHtml += `<div style="border-radius:var(--rs);border:2px dashed var(--border);display:flex;align-items:center;justify-content:center;aspect-ratio:1;cursor:pointer;color:var(--muted);flex-direction:column;gap:3px;font-size:.71rem" onclick="go('feed');setTimeout(openCreatePost,100)"><span style="font-size:1.4rem">+</span>Добавить</div>`;
    postsHtml += '</div>';
  }

  const avatar = u.avatar || ('https://i.pravatar.cc/80?u=' + u.email);

  wrap.innerHTML = `
    <div class="pr-hero">
      <div class="pr-av">
        <img src="${avatar}" alt="${u.name}" id="prof-av-img">
        <div class="pr-av-e" onclick="document.getElementById('av-file').click()" title="Изменить фото">&#9998;</div>
        <input type="file" id="av-file" accept="image/*" style="display:none" onchange="changeAvatar(this)">
      </div>
      <div class="pr-info">
        <div class="pr-name">${u.name}</div>
        <div class="pr-email">${u.email}</div>
        <div class="pr-ptags">${tagsHtml}</div>
        <div class="pr-btns">
          <button class="bs" style="font-size:.78rem;padding:7px 14px" onclick="showEdit()">Редактировать</button>
          <button class="bs" style="font-size:.78rem;padding:7px 14px;border-color:rgba(229,62,62,.28);color:#C53030" onclick="logout()">Выйти</button>
        </div>
      </div>
    </div>

    <div class="edit-form" id="edit-form">
      <div style="font-size:.72rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:12px">Редактировать профиль</div>
      <div class="fg"><label>Имя</label><input class="fi" id="e-nm" value="${u.name}"></div>
      <div class="fg"><label>Email</label><input class="fi" id="e-em" value="${u.email}" type="email"></div>
      <div style="display:flex;gap:9px;margin-top:4px">
        <button class="bp" style="font-size:.84rem;padding:9px 18px" onclick="saveEdit()">Сохранить</button>
        <button class="bs" style="font-size:.84rem;padding:8px 14px" onclick="hideEdit()">Отмена</button>
      </div>
    </div>

    <div class="pr-stats">
      <div class="stat"><div class="stat-n">${S.wishlist.length}</div><div class="stat-l">Сохранённых мест</div></div>
      <div class="stat"><div class="stat-n">${myPosts.length}</div><div class="stat-l">Публикаций</div></div>
      <div class="stat"><div class="stat-n">${S.tourPts.length ? 1 : 0}</div><div class="stat-l">Маршрутов</div></div>
    </div>

    <div class="pr-sec">
      <div class="pr-sec-hd">Вкусовой профиль</div>
      <div class="vg">${vecHtml}</div>
    </div>

    <div class="pr-sec">
      <div class="pr-sec-hd">Публикации</div>
      ${postsHtml}
    </div>`;
}

function showEdit() { document.getElementById('edit-form').classList.add('on'); }
function hideEdit() { document.getElementById('edit-form').classList.remove('on'); }

function saveEdit() {
  const nm = document.getElementById('e-nm').value.trim();
  const em = document.getElementById('e-em').value.trim();
  if (!nm || !em) { toast('Заполни все поля'); return; }
  S.user = {...S.user, name: nm, email: em};
  saveS(); hideEdit(); renderProfile(); updateNav(); toast('Профиль обновлён');
}

function changeAvatar(input) {
  const file = input.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    S.user = {...S.user, avatar: e.target.result};
    saveS();
    const navAv = document.getElementById('nav-av');
    if (navAv) navAv.src = S.user.avatar;
    const profImg = document.getElementById('prof-av-img');
    if (profImg) profImg.src = S.user.avatar;
    renderMasonry();
    toast('Фото профиля обновлено');
  };
  reader.readAsDataURL(file);
  input.value = '';
}