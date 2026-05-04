/* ════ POST MODAL ════ */

function openPost(id) {
  const p = getAllPosts().find(x => String(x.id) === String(id));
  if (!p) return;
  S.curPost = p; S.pmIdx = 0;

  document.getElementById('pm-ttl').textContent  = p.title;
  document.getElementById('pm-tp').textContent   = p.type || 'Пост путешественника';
  document.getElementById('pm-tags').innerHTML   = p.tags.map(t => `<span class="pill">${t}</span>`).join('');
  document.getElementById('pm-desc').textContent = p.desc;

  const isMyPost = p.isUserPost && S.user && p.userId === (S.user.id || S.user.email);
  document.getElementById('pm-av').src = isMyPost && S.user?.avatar
    ? S.user.avatar
    : `https://i.pravatar.cc/60?u=${p.id}`;
  document.getElementById('pm-an').textContent = isMyPost && S.user ? S.user.name : p.author;
  document.getElementById('pm-at').textContent = p.isUserPost
    ? (isMyPost ? 'Ваш пост' : 'Путешественник')
    : (p.biz ? 'Представитель бизнеса' : 'Путешественник');

  // Показываем кнопку удаления только для своих постов
  const deleteBtn = document.getElementById('pm-btn-delete');
  if (deleteBtn) deleteBtn.style.display = isMyPost ? 'flex' : 'none';

  renderPmSlides();
  document.getElementById('post-modal').classList.add('on');
  document.getElementById('pm-close-btn').classList.add('on');
  document.body.style.overflow = 'hidden';

  // Закрытие по Escape
  document._pmEsc = (e) => { if (e.key === 'Escape') closePost(); };
  document.addEventListener('keydown', document._pmEsc);
}

function renderPmSlides() {
  const p = S.curPost; if (!p) return;
  document.getElementById('pm-img').src = p.imgs[S.pmIdx];
  document.getElementById('pm-dots').innerHTML = p.imgs.map((_, i) =>
    `<div class="pm-dot ${i === S.pmIdx ? 'on' : ''}" onclick="pmGo(${i})"></div>`
  ).join('');
}

function pmSlide(d) {
  if (!S.curPost) return;
  S.pmIdx = (S.pmIdx + d + S.curPost.imgs.length) % S.curPost.imgs.length;
  renderPmSlides();
}

function pmGo(i) { S.pmIdx = i; renderPmSlides(); }

function closePost() {
  document.getElementById('post-modal').classList.remove('on');
  document.getElementById('pm-close-btn').classList.remove('on');
  document.body.style.overflow = '';
  if (document._pmEsc) {
    document.removeEventListener('keydown', document._pmEsc);
    document._pmEsc = null;
  }
}

function saveFromPost() {
  if (!S.curPost) return;
  const id = S.curPost.id;
  if (!S.wishlist.includes(id)) {
    S.wishlist.push(id);
    if (!S._savedOnce[id]) { S.interactions++; S._savedOnce[id] = true; }
    saveS(); toast('Место сохранено');
  } else {
    toast('Уже сохранено');
  }
}

function openVidFromPost() {
  if (!S.curPost) return;
  closePost();
  openVid(S.curPost.title, S.curPost.imgs, S.curPost.tags, 'https://sutochno.ru');
}

async function deletePost() {
  const p = S.curPost;
  if (!p) return;

  if (!confirm('Удалить этот пост?')) return;

  // Удаляем из API если есть apiId
  if (p.apiId && localStorage.getItem('kv_token')) {
    try {
      await apiDeletePost(p.apiId);
    } catch (e) {
      console.warn('API delete failed:', e.message);
    }
  }

  // Запоминаем удалённый id — getAllPosts() будет его фильтровать
  // даже если он вернётся из кэша или нового fetch'а
  S._deletedPostIds.add(String(p.id));

  // Удаляем из локального хранилища
  const local = getUserPostsLocal().filter(x => String(x.id) !== String(p.id));
  saveUserPostsLocal(local);

  // Удаляем из кэша и помечаем, что нужен свежий fetch при следующем визите в ленту
  S._apiPosts = S._apiPosts.filter(x => String(x.id) !== String(p.id));
  S._apiPostsLoaded = false;

  // Удаляем из вишлиста если там был
  S.wishlist = S.wishlist.filter(id => String(id) !== String(p.id));
  saveS();

  closePost();
  renderMasonry();
  renderProfile();
  toast('Пост удалён');
}