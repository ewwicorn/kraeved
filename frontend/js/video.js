/* ════ VIDEO MODAL ════ */

function openVid(name, imgs, tags, url) {
  document.getElementById('vloc').textContent = name;
  document.getElementById('vtags').innerHTML  = (Array.isArray(tags) ? tags : [])
    .map(t => `<span class="pill">${t}</span>`).join('');
  document.getElementById('vbook').href = url || '#';

  S.vidSlide = 0; S.vidImgs = imgs;
  if (S.vidInterval) { clearInterval(S.vidInterval); S.vidInterval = null; }

  document.getElementById('vsli').innerHTML = imgs.map((src, i) =>
    `<div class="vsl" style="transform:translateX(${i * 100}%)">
       <img src="${src}" alt="" loading="lazy">
     </div>`
  ).join('');

  renderVDots();
  let prog = 0;
  document.getElementById('vpbar').style.width = '0%';

  S.vidInterval = setInterval(() => {
    prog += 100 / 40;
    document.getElementById('vpbar').style.width = Math.min(prog, 100) + '%';
    if (prog >= 100) {
      prog = 0;
      S.vidSlide = (S.vidSlide + 1) % imgs.length;
      document.querySelectorAll('.vsl').forEach((s, i) => {
        s.style.transform = `translateX(${(i - S.vidSlide) * 100}%)`;
      });
      renderVDots();
    }
  }, 100);

  document.getElementById('vid-modal').classList.add('on');
  document.body.style.overflow = 'hidden';
}

function renderVDots() {
  document.getElementById('vdots').innerHTML = S.vidImgs.map((_, i) =>
    `<div class="vdot ${i === S.vidSlide ? 'on' : ''}"></div>`
  ).join('');
}

function closeVid() {
  if (S.vidInterval) { clearInterval(S.vidInterval); S.vidInterval = null; }
  document.getElementById('vid-modal').classList.remove('on');
  document.body.style.overflow = '';
}
