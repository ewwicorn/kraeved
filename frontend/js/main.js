/* ════ MAIN — APP INIT ════ */

/* Инициализация страницы лендинга (превью постов) */
(function initLanding() {
  document.getElementById('prev-grid').innerHTML = POSTS.slice(0, 6).map(p => `
    <div class="pcard" onclick="go('ob')">
      <img src="${p.img}" alt="${p.title}" loading="lazy">
      <div class="pcard-i">
        <strong>${p.title}</strong>
        <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:3px">
          ${p.tags.slice(0, 2).map(t => `<span class="pill dk">${t}</span>`).join('')}
        </div>
      </div>
    </div>`).join('');
})();

/* Инициализация слайдера бюджета на странице тура */
(function initBudgetSlider() {
  const el = document.getElementById('bsli');
  if (el) document.getElementById('bfill').style.width = ((parseInt(el.value) - 3000) / (50000 - 3000) * 100) + '%';
})();

/* Старт приложения */
async function appStart() {
  // Попытка восстановить сессию через токен
  await tryRestoreSession();

  // Показываем стартовую страницу
  updateNav();
  go('landing');
}

appStart();
