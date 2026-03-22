/* ════ AUTH ════ */

function authTab(type, el) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('on'));
  el.classList.add('on');
  if (type === 'b') { clrAuth(); toast('Бизнес-аккаунт — скоро'); }
}

function toggleAuth() {
  S.authMode = S.authMode === 'login' ? 'register' : 'login';
  const r = S.authMode === 'register';
  document.getElementById('auth-title').textContent = r ? 'Создать аккаунт' : 'Добро пожаловать';
  document.getElementById('auth-sub').textContent   = r ? 'Заполни форму для регистрации' : 'Войдите в аккаунт';
  document.getElementById('albl').textContent       = r ? 'Зарегистрироваться' : 'Войти';
  document.getElementById('fg-cf').style.display   = r ? 'block' : 'none';
  document.getElementById('fg-nm').style.display   = r ? 'block' : 'none';
  document.getElementById('auth-sw').innerHTML     = r
    ? 'Уже есть аккаунт? <a onclick="toggleAuth()">Войти</a>'
    : 'Нет аккаунта? <a onclick="toggleAuth()">Зарегистрироваться</a>';
  clrAuth();
}

function clrAuth() {
  document.getElementById('aerr').classList.remove('on');
  document.getElementById('aok').classList.remove('on');
  ['a-nm','a-em','a-pw','a-cf'].forEach(id => {
    const e = document.getElementById(id);
    if (e) e.classList.remove('err', 'ok');
  });
}

function showAuthErr(m) { const e = document.getElementById('aerr'); e.textContent = m; e.classList.add('on'); }
function showAuthOk(m)  { const e = document.getElementById('aok');  e.textContent = m; e.classList.add('on'); }
function setAuthLd(v)   { document.getElementById('abtn').classList.toggle('loading', v); }

function doVk() {
  clrAuth(); setAuthLd(true);
  setTimeout(() => {
    setAuthLd(false);
    loginUser({ name: 'Алексей Краснов', email: 'alex@vk.com',
                avatar: 'https://i.pravatar.cc/80?u=vk42', provider: 'vk' });
  }, 1400);
}

async function doAuth() {
  clrAuth();
  const em = document.getElementById('a-em').value.trim();
  const pw = document.getElementById('a-pw').value;

  if (!em) { document.getElementById('a-em').classList.add('err'); showAuthErr('Введите email'); return; }
  if (!pw || pw.length < 6) { document.getElementById('a-pw').classList.add('err'); showAuthErr('Пароль — минимум 6 символов'); return; }

  setAuthLd(true);

  try {
    if (S.authMode === 'register') {
      const nm = document.getElementById('a-nm').value.trim();
      const cf = document.getElementById('a-cf').value;
      if (!nm)    { document.getElementById('a-nm').classList.add('err'); showAuthErr('Введите имя'); setAuthLd(false); return; }
      if (pw !== cf) { document.getElementById('a-cf').classList.add('err'); showAuthErr('Пароли не совпадают'); setAuthLd(false); return; }

      const nameParts = nm.trim().split(' ');
      const first = nameParts[0] || nm;
      const last  = nameParts.slice(1).join(' ') || '.';

      const userOut = await apiRegister({ email: em, password: pw, first_name: first, last_name: last });
      document.getElementById('a-em').classList.add('ok');
      showAuthOk('Аккаунт создан — выполняем вход...');

      // Сразу логинимся
      const tokenRes = await apiLogin({ email: em, password: pw });
      localStorage.setItem('kv_token', tokenRes.access_token);

      setTimeout(() => {
        loginUser({
          id:        userOut.id,
          name:      first + (last !== '.' ? ' ' + last : ''),
          email:     userOut.email,
          avatar:    'https://i.pravatar.cc/80?u=' + userOut.email,
          first_name: first, last_name: last,
          role:      userOut.role,
        });
      }, 600);

    } else {
      const tokenRes = await apiLogin({ email: em, password: pw });
      localStorage.setItem('kv_token', tokenRes.access_token);

      const me = await apiMe();
      document.getElementById('a-em').classList.add('ok');
      showAuthOk('Добро пожаловать');

      setTimeout(() => {
        loginUser({
          id:        me.id,
          name:      (me.first_name + ' ' + me.last_name).trim(),
          email:     me.email,
          avatar:    'https://i.pravatar.cc/80?u=' + me.email,
          first_name: me.first_name,
          last_name:  me.last_name,
          role:       me.role,
        });
      }, 600);
    }
  } catch (err) {
    setAuthLd(false);
    if (err.status === 400 || err.status === 401 || err.status === 409) {
      showAuthErr(err.message || 'Неверный email или пароль');
    } else {
      // Бэкенд недоступен — demo-режим
      showAuthOk('Вход выполнен (демо-режим)');
      setTimeout(() => {
        loginUser({
          name: 'Путешественник', email: em,
          avatar: 'https://i.pravatar.cc/80?u=' + em, provider: 'demo',
        });
      }, 600);
    }
  }
}

function loginUser(u) {
  S.loggedIn = true;
  S.user = u;
  saveS();
  updateNav();
  go(S.obDone ? 'feed' : 'ob');
}

async function logout() {
  // Сначала чистим локально — независимо от ответа бэкенда
  const token = localStorage.getItem('kv_token');
  localStorage.removeItem('kv_token');
  S.loggedIn = false;
  S.user = null;
  saveS();
  updateNav();
  go('landing');
  toast('До встречи');

  // Уведомляем бэкенд (токен в blacklist), но 401/ошибки игнорируем
  if (token) {
    try {
      await fetch(API_BASE + '/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token },
      });
    } catch (_) {}
  }
}

/* Восстановить сессию по токену при загрузке */
async function tryRestoreSession() {
  const token = localStorage.getItem('kv_token');
  if (!token || !S.loggedIn) return;
  try {
    const me = await apiMe();
    S.user = {
      id:         me.id,
      name:       (me.first_name + ' ' + me.last_name).trim(),
      email:      me.email,
      avatar:     S.user?.avatar || ('https://i.pravatar.cc/80?u=' + me.email),
      first_name: me.first_name,
      last_name:  me.last_name,
      role:       me.role,
    };
    S.loggedIn = true;
    saveS();
    updateNav();
  } catch (e) {
    // Токен протух — сбрасываем
    localStorage.removeItem('kv_token');
    S.loggedIn = false;
    S.user = null;
    saveS();
    updateNav();
  }
}
