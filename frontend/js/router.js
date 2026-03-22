/* ════ ROUTER ════ */

function go(pg) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('on'));
  const el = document.getElementById('pg-' + pg);
  if (el) el.classList.add('on');
  window.scrollTo(0, 0);
  document.getElementById('nb').classList.toggle('dk', pg === 'landing');

  if (pg === 'feed')        { initFeed(); }
  if (pg === 'tour-new')    { renderSpPrev(); }
  if (pg === 'tour-result') { renderTourResult(); }
  if (pg === 'ob')          { initOb(); }
  if (pg === 'map')         { initFullMap(); }
  if (pg === 'places')      { renderPlaces(); }
  if (pg === 'profile')     { renderProfile(); }

  updateNav();
}
