/* ════ UI HELPERS ════ */

let ymapsLoaded = false;

function toast(msg) {
  const c = document.getElementById('toasts');
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 2700);
}

function showLoader(txt) {
  document.getElementById('ltxt').textContent = txt || 'Загружаем...';
  document.getElementById('loader').classList.add('on');
}

function hideLoader() {
  document.getElementById('loader').classList.remove('on');
}

function updateNav() {
  const btn    = document.getElementById('nav-btn');
  const usr    = document.getElementById('nav-user');
  const postBtn = document.getElementById('nav-post-btn');
  if (S.loggedIn && S.user) {
    btn.style.display = 'none';
    usr.style.display = 'flex';
    document.getElementById('nav-av').src = S.user.avatar || ('https://i.pravatar.cc/80?u=' + S.user.email);
    document.getElementById('nav-nm').textContent = (S.user.name || S.user.first_name || '').split(' ')[0];
    if (postBtn) postBtn.style.display = '';
  } else {
    btn.style.display = '';
    usr.style.display = 'none';
    btn.textContent = 'Войти';
    btn.onclick = () => go('auth');
    if (postBtn) postBtn.style.display = 'none';
  }
}
