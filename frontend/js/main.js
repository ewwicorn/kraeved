/* ════ MAIN — APP INIT ════ */

/* Лендинг: показываем красивые unsplash-фото пока нет реальных постов */
(function initLanding() {
  const PREVIEW_IMGS = [
    { img:'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=700&q=80', title:'Виноградники', tags:['Вино','Природа'] },
    { img:'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=700&q=80', title:'Горные тропы',  tags:['Трекинг','Эко'] },
    { img:'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=700&q=80', title:'Гастрономия',  tags:['Гастро','Ферма'] },
    { img:'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=700&q=80', title:'Спа и релакс', tags:['Спа','Горы'] },
    { img:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=700&q=80', title:'Море и закаты', tags:['Море','Закат'] },
    { img:'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=700&q=80', title:'Дикая природа', tags:['Горы','Туман'] },
  ];

  const grid = document.getElementById('prev-grid');
  if (!grid) return;

  grid.innerHTML = PREVIEW_IMGS.map(p => `
    <div class="pcard" onclick="go('ob')">
      <img src="${p.img}" alt="${p.title}" loading="lazy">
      <div class="pcard-i">
        <strong>${p.title}</strong>
        <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:3px">
          ${p.tags.map(t => `<span class="pill dk">${t}</span>`).join('')}
        </div>
      </div>
    </div>`).join('');
})();

/* Инициализация слайдера бюджета */
(function initBudgetSlider() {
  const el = document.getElementById('bsli');
  if (el) document.getElementById('bfill').style.width = ((parseInt(el.value) - 3000) / (50000 - 3000) * 100) + '%';
})();

/* Старт приложения */
async function appStart() {
  await tryRestoreSession();
  updateNav();
  go('landing');
}

appStart();
