/* ════ ONBOARDING ════ */

let _obStep = 0;

function initOb() { _obStep = 0; renderOb(); }

function renderOb() {
  const step  = _obStep;
  const total = OB_STEPS.length + 1;
  document.getElementById('ob-bar').style.width = Math.round(step / total * 100) + '%';
  document.getElementById('ob-lbl').textContent = `Шаг ${step + 1} из ${total}`;

  if (step < OB_STEPS.length) {
    const s = OB_STEPS[step];
    document.getElementById('ob-q').textContent = s.q;
    document.getElementById('ob-body').innerHTML = `<div class="ob-cards">
      ${s.cards.map((c, i) => `
        <div class="ob-card" onclick="pickOb(${i})">
          <img src="${c.img}" alt="${c.lbl}" loading="lazy">
          <div class="ob-cov">
            <div class="ob-clbl">${c.lbl}</div>
            <div class="ob-csub">${c.sub}</div>
          </div>
          <div class="ob-chk">&#10003;</div>
        </div>`).join('')}
    </div>`;
  } else {
    document.getElementById('ob-q').textContent = 'Последние детали';
    document.getElementById('ob-body').innerHTML = `<div class="ob-qs">
      <div class="qb">
        <div class="ql">Состав группы</div>
        <div class="qr">${['Соло','Пара','Семья','Друзья'].map(l =>
          `<span class="pt" onclick="togQ(this)">${l}</span>`).join('')}</div>
      </div>
      <div class="qb">
        <div class="ql">Бюджет на человека</div>
        <input type="range" class="rng" min="3000" max="50000" value="15000" step="1000"
          oninput="this.nextElementSibling.textContent='до '+parseInt(this.value).toLocaleString('ru')+'\u00a0₽'">
        <div class="rng-v">до 15 000 ₽</div>
      </div>
      <div class="qb">
        <div class="ql">Транспорт</div>
        <div class="qr">
          <span class="pt" onclick="togQ(this)">На машине</span>
          <span class="pt" onclick="togQ(this)">Без машины</span>
        </div>
      </div>
      <div style="margin-top:30px">
        <button class="bp bfull" onclick="finishOb()">Готово — смотреть ленту</button>
      </div>
    </div>`;
  }
}

function pickOb(i) {
  document.querySelectorAll('.ob-card').forEach(c => c.classList.remove('sel'));
  document.querySelectorAll('.ob-card')[i].classList.add('sel');
  setTimeout(() => { _obStep++; renderOb(); }, 480);
}

function togQ(el) {
  el.closest('.qr').querySelectorAll('.pt').forEach(p => p.classList.remove('on'));
  el.classList.add('on');
}

function finishOb() {
  const grpSel = document.querySelector('.qr .pt.on');
  if (!grpSel) { toast('Выбери состав группы'); return; }
  S.obDone = true;
  S.loggedIn = true;
  saveS();
  go('feed');
  toast('Лента готова — листай');
}
