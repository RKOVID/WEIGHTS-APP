/* WEIGHT REMINDER - app pesi gru */
(function () {
  const KEY = 'weightReminder.v2';
  const ZONES = ['beam_top', 'beam_dx', 'beam_sx', 'col_dx', 'col_sx'];
  const FACTORY = { col_sx: [], col_dx: [3.005, 3.005, 6.062, 6.062, 6.062], beam_dx: [0.51, 2.379, 2.379], beam_sx: [0.51, 2.379, 2.379], beam_top: [9.958, 9.958] };

  // ---------- stato ----------
  const uid = () => Math.random().toString(36).slice(2, 9);
  const clone = o => JSON.parse(JSON.stringify(o));
  const allPresent = layout => Object.fromEntries(ZONES.map(z => [z, layout[z].map(() => true)]));
  function newCrane(name, addr) {
    return { id: uid(), name, addr: addr || '', layout: clone(FACTORY), present: allPresent(FACTORY) };
  }
  function defaults() {
    return {
      lang: 'it', stock: clone(BASE_STOCK), stockInit: true, last: null,
      cranes: [newCrane('Seriale 1', 'Milano, Via Femoni 35'), newCrane('Seriale 2'), newCrane('Seriale 3'), newCrane('Seriale 4')]
    };
  }
  const BASE_STOCK = { '2.379': 3, '0.51': 2 };   // stock base: 3 pesi lunghi da 2,379 + 2 da 0,51
  let S;
  try { S = JSON.parse(localStorage.getItem(KEY)) || defaults(); } catch (e) { S = defaults(); }
  if (!S.stockInit) { if (!Object.keys(S.stock || {}).length) S.stock = clone(BASE_STOCK); S.stockInit = true; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } }

  // ---------- util ----------
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const t = k => (I18N[S.lang] && I18N[S.lang][k]) || I18N.it[k] || k;
  const fmt = n => String(Math.round(n * 1000) / 1000).replace('.', ',');
  const skey = kg => String(Number(kg));
  const crane = id => S.cranes.find(c => c.id === id);
  const sum = a => a.reduce((s, v) => s + v, 0);
  const ICON_HOME = '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10"/></svg>';
  // ingranaggio: 8 denti trapezoidali + foro centrale
  const ICON_GEAR = (() => {
    const n = 8, R = 11, r = 8, p = [];
    for (let i = 0; i < n; i++) {
      const a = i * 2 * Math.PI / n, s = Math.PI / n;
      [[-0.42, r], [-0.24, R], [0.24, R], [0.42, r]].forEach(([k, rad]) => {
        const th = a + k * s * 2; p.push((12 + rad * Math.cos(th)).toFixed(2) + ' ' + (12 + rad * Math.sin(th)).toFixed(2));
      });
    }
    return '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M' + p.join('L') + 'Z"/><circle cx="12" cy="12" r="3.2"/></svg>';
  })();

  function toast(msg) {
    let el = $('#toast'); if (!el) { el = document.createElement('div'); el.id = 'toast'; document.body.appendChild(el); }
    el.textContent = msg; el.classList.add('show'); clearTimeout(toast.t);
    toast.t = setTimeout(() => el.classList.remove('show'), 2600);
  }
  function modal(html, onMount) {
    const o = document.createElement('div'); o.className = 'overlay';
    o.innerHTML = `<div class="modal">${html}</div>`;
    o.addEventListener('click', e => { if (e.target === o) o.remove(); });
    document.body.appendChild(o); onMount && onMount(o); return o;
  }

  // ---------- logica pesi ----------
  function toggleSlot(c, zone, i) {
    const kg = c.layout[zone][i], k = skey(kg);
    c.log = c.log || [];
    const was = c.present[zone][i];
    const entry = { t: Date.now(), z: zone, i, w: kg, a: was ? 'rem' : 'add', s: true }; c.log.push(entry);
    if (c.log.length > 500) c.log.splice(0, c.log.length - 500);
    if (was) {                             // tolgo il peso dalla gru -> finisce nello stock
      c.present[zone][i] = false; S.stock[k] = (S.stock[k] || 0) + 1;
    } else {                               // aggiungo il peso alla gru -> esce dallo stock
      c.present[zone][i] = true;
      if ((S.stock[k] || 0) > 0) S.stock[k]--; else { entry.s = false; toast(t('stockZero').replace('{lb}', fmt(kg))); }
    }
    save();
  }
  // annulla l'ultima azione (ripristina anche lo stock)
  function undoLast(c) {
    const e = (c.log || [])[c.log.length - 1];
    if (!e || e.i === undefined || !c.layout[e.z] || c.layout[e.z][e.i] !== e.w) return false;
    const k = skey(e.w);
    if (e.a === 'rem') { c.present[e.z][e.i] = true; S.stock[k] = Math.max(0, (S.stock[k] || 0) - 1); }
    else { c.present[e.z][e.i] = false; if (e.s) S.stock[k] = (S.stock[k] || 0) + 1; }
    c.log.pop(); save(); return true;
  }
  function totals(c) {
    let inst = 0, fact = 0; const groups = {};
    ZONES.forEach(z => c.layout[z].forEach((kg, i) => {
      fact += kg;
      if (c.present[z][i]) { inst += kg; groups[skey(kg)] = (groups[skey(kg)] || 0) + 1; }
    }));
    return { inst, fact, removed: fact - inst, groups };
  }
  // pesi tolti dalla gru (da rimettere per tornare alla config di fabbrica) che non ho nello stock
  function missing(c) {
    const need = {};
    ZONES.forEach(z => c.layout[z].forEach((kg, i) => { if (!c.present[z][i]) need[skey(kg)] = (need[skey(kg)] || 0) + 1; }));
    return Object.keys(need).map(k => ({ kg: Number(k), need: need[k], have: S.stock[k] || 0 }))
      .filter(x => x.need > x.have).sort((a, b) => b.kg - a.kg);
  }
  const stockRows = () => Object.keys(S.stock).map(Number).filter(k => S.stock[skey(k)] > 0).sort((a, b) => b - a);

  // ---------- router ----------
  let draft = null;      // nuova gru non ancora salvata
  let view = null;       // CraneView corrente
  const app = $('#app');
  function go(h) { if (location.hash === h) render(); else location.hash = h; }
  window.addEventListener('hashchange', render);
  function render() {
    if (view) { view.destroy(); view = null; }
    const [, page, id] = location.hash.split('/');
    window.scrollTo(0, 0);
    if (page === 'crane' && crane(id)) return renderCrane(crane(id));
    if (page === 'settings') return renderSettings();
    if (page === 'edit') return renderEdit(id);
    renderHome();
  }
  const header = (back) => `<header class="top">
      <button class="icon" data-go="#/" aria-label="${t('home')}">${ICON_HOME}</button>
      <div class="ttl">${t('appTitle')}</div>
      <button class="icon" data-go="#/settings" aria-label="${t('settings')}">${ICON_GEAR}</button></header>`;
  app.addEventListener('click', e => { const g = e.target.closest('[data-go]'); if (g) { e.preventDefault(); go(g.dataset.go); } });

  // ---------- HOME ----------
  function renderHome() {
    const cur = (S.last && crane(S.last)) ? S.last : (S.cranes[0] && S.cranes[0].id);
    const opts = S.cranes.map(c => `<option value="${c.id}" ${c.id === cur ? 'selected' : ''}>${esc(c.name)}</option>`).join('');
    app.innerHTML = `${header()}
      <main class="home">
        <h1>${t('appTitle')}</h1>
        <img class="hero" src="cervello.png" alt="">
        <label class="sel-l" for="sel">${t('select')}</label>
        <div class="selrow">
          <select id="sel" class="big-select">${opts}</select>
          <button class="plus" id="newc" aria-label="${t('addCrane')}">+</button>
        </div>
        ${S.cranes.length ? `<button class="btn go" id="open">${t('open')}</button>` : `<p class="muted">${t('noCranes')}</p>`}
      </main>`;
    $('#newc').onclick = () => { const c = newCrane(t('newName') + ' ' + (S.cranes.length + 1)); draft = c; go('#/edit/' + c.id); };
    const op = $('#open'); if (op) op.onclick = () => { const v = $('#sel').value; if (v) go('#/crane/' + v); };
  }

  // ---------- PAGINA GRU ----------
  function renderCrane(c) {
    S.last = c.id; save();
    let selZone = null, selSlot = -1;
    app.innerHTML = `${header()}
      <main class="crane">
        <section class="cinfo">
          <div><h2>${esc(c.name)}</h2><p class="muted">${esc(c.addr) || '&nbsp;'}</p></div>
          <button class="btn small" data-go="#/edit/${c.id}">${t('edit')}</button>
        </section>
        <section class="strip" id="strip"></section>
        <section class="card mcard">
          <div class="toolbar tb">
            <button data-v="dx">${t('vDx')}</button><button data-v="sx">${t('vSx')}</button>
            <button data-v="top">${t('vTop')}</button><button data-v="reset">${t('vReset')}</button>
          </div>
          <div class="cvwrap"><canvas id="cv"></canvas><canvas id="cl"></canvas></div>
        </section>
        <section class="lastl" id="lastl"></section>
        <section class="card" id="zp"></section>
        <section class="split">
          <div class="card" id="pg"></div>
          <div class="card" id="ps"></div>
        </section>
        <button class="btn logbtn" id="logb">${t('logTitle')}</button>
      </main>`;
    $('#logb').onclick = () => showLog(c);
    const cv = $('#cv');
    view = new CraneView(cv, $('#cl'), (zone, slot) => {
      if (!zone) { selZone = null; selSlot = -1; }
      else { selZone = zone; selSlot = slot; }
      refresh();
    }, {
      model: 'gru.glb',
      label: (z, i) => { const w = fmt(c.layout[z][i]); return [w, w + ' lb']; },
      onReady: () => refresh()
    });
    $('.toolbar').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.v) view.preset(b.dataset.v);
    });

    function refresh() {
      const zmap = {};
      ZONES.forEach(z => zmap[z] = { weights: c.layout[z], present: c.present[z] });
      view.setZones(zmap); view.select(selZone, selSlot);
      const T0 = totals(c), M0 = missing(c), nm = M0.reduce((s, x) => s + x.need - x.have, 0);
      $('#strip').innerHTML = `<div><span>${t('installed')}</span><b>${fmt(T0.inst)} lb</b></div>
        <div><span>${t('removedTot')}</span><b>${fmt(T0.removed)} lb</b></div>
        ${nm ? `<button class="sw" id="stw"><span>&#9888; ${t('warn')}</span><b>${t('missingN').replace('{n}', nm)}</b></button>` : `<div class="okc"><span>${t('stock')}</span><b>OK</b></div>`}`;
      const le = (c.log || [])[(c.log || []).length - 1];
      $('#lastl').innerHTML = le ? `<span class="ll">${t('last')}: <b class="${le.a}">${t(le.a === 'rem' ? 'logRem' : 'logAdd')}</b> ${fmt(le.w)} lb &middot; ${t('z_' + le.z)}</span>
        ${le.i !== undefined ? `<button class="btn small" id="undo">&#8630; ${t('undo')}</button>` : ''}` : '';

      // zone + pesi della zona scelta
      const chips = ZONES.filter(z => c.layout[z].length).map(z => {
        const n = c.present[z].filter(Boolean).length, tot = c.layout[z].length;
        const st = n === tot ? 'full' : n === 0 ? 'none' : 'part';
        return `<button class="chip ${st} ${z === selZone ? 'on' : ''}" data-z="${z}">${t('z_' + z)} <i>${n}/${tot}</i></button>`;
      }).join('');
      let body = `<p class="muted">${t('pickZone')}</p>`;
      if (selZone) {
        const on = selSlot >= 0 && c.layout[selZone][selSlot] !== undefined, pres = on && c.present[selZone][selSlot];
        body = `<div class="zhead"><b>${t('z_' + selZone)}</b><button class="btn small" id="zoomz">&#128269; ${t('zoomZone')}</button></div>
          <div class="slots">${c.layout[selZone].map((kg, i) =>
            `<button class="slot ${c.present[selZone][i] ? 'on' : 'off'} ${i === selSlot ? 'sel' : ''}" data-i="${i}">
              <span class="kg">${fmt(kg)} lb</span><span class="st">${c.present[selZone][i] ? t('present') : t('removed')}</span></button>`).join('')}</div>
          ${on ? `<button class="act ${pres ? 'take' : 'put'}" id="act">${pres ? t('takeOff') : t('putBack')} &middot; ${fmt(c.layout[selZone][selSlot])} lb</button>`
               : `<p class="muted small">${t('tapHint')}</p>`}`;
      }
      $('#zp').innerHTML = `<div class="chips">${chips}</div>${body}`;

      // pesi gru
      const T = totals(c), gk = Object.keys(T.groups).map(Number).sort((a, b) => b - a);
      $('#pg').innerHTML = `<details><summary><span>${t('weightsCrane')}</span><b>${fmt(T.inst)} lb</b></summary>
        <ul class="list">${gk.map(k => `<li><span>${T.groups[skey(k)]} × ${fmt(k)} lb</span></li>`).join('') || '<li class="muted">—</li>'}</ul>
        <div class="muted small">${t('factory')}: ${fmt(T.fact)} lb<br>${t('removedTot')}: ${fmt(T.removed)} lb</div></details>`;

      // stock
      const rows = stockRows();
      $('#ps').innerHTML = `<h3>${t('stock')}</h3>
        <ul class="list">${rows.map(k => `<li><span>${S.stock[skey(k)]} × ${fmt(k)} lb</span>
            <span class="pm"><button data-s="${k}" data-d="-1">−</button><button data-s="${k}" data-d="1">+</button></span></li>`).join('') ||
        `<li class="muted">${t('stockEmpty')}</li>`}</ul>
        <button class="btn small" id="addst">+ ${t('addWeight')}</button>`;
    }    $('#zp').addEventListener('click', e => {
      const ch = e.target.closest('.chip'), sl = e.target.closest('.slot');
      if (ch) { selZone = ch.dataset.z; selSlot = -1; view.focus(selZone); refresh(); }
      else if (sl && selZone) { selSlot = Number(sl.dataset.i); refresh(); }
      else if (e.target.closest('#act')) { toggleSlot(c, selZone, selSlot); refresh(); }
      else if (e.target.id === 'zoomz') view.focus(selZone);
    });
    $('#strip').addEventListener('click', e => { if (e.target.closest('#stw')) showOrder(c); });
    $('#lastl').addEventListener('click', e => { if (e.target.closest('#undo') && undoLast(c)) { refresh(); toast(t('undone')); } });
    $('#ps').addEventListener('click', e => {
      const b = e.target.closest('button[data-s]');
      if (b) { const k = skey(b.dataset.s); S.stock[k] = Math.max(0, (S.stock[k] || 0) + Number(b.dataset.d)); save(); refresh(); }
      if (e.target.closest('#addst')) addStockModal(() => refresh());
    });
    refresh();
  }

  function addStockModal(done) {
    modal(`<h3>${t('addWeight')}</h3>
      <form id="addf"><label>lb<input type="text" inputmode="decimal" placeholder="2,379" required autofocus></label>
      <div class="row"><button class="btn primary">${t('save')}</button><button type="button" class="btn" id="cls">${t('cancel')}</button></div></form>`, o => {
      $('#cls', o).onclick = () => o.remove();
      $('#addf', o).onsubmit = e => {
        e.preventDefault();
        const v = Number(o.querySelector('input').value.replace(',', '.'));
        if (v > 0) { const k = skey(v); S.stock[k] = (S.stock[k] || 0) + 1; save(); o.remove(); done(); }
      };
      setTimeout(() => { const i = o.querySelector('input'); i && i.focus(); }, 50);
    });
  }

  function showLog(c) {
    const L = (c.log || []).slice().reverse();
    const loc = { it: 'it-IT', de: 'de-DE', es: 'es-ES', fr: 'fr-FR' }[S.lang] || 'it-IT';
    modal(`<h3>${t('logTitle')} · ${esc(c.name)}</h3>
      <ul class="list logl">${L.map(e => `<li><span class="lt">${new Date(e.t).toLocaleString(loc, { dateStyle: 'short', timeStyle: 'short' })}</span>
        <span class="${e.a}">${t(e.a === 'rem' ? 'logRem' : 'logAdd')}</span> ${fmt(e.w)} lb · ${t('z_' + e.z)}</li>`).join('') || `<li class="muted">${t('logEmpty')}</li>`}</ul>
      <div class="row"><button class="btn" id="lcl">${t('logClear')}</button><button class="btn primary" id="cls">${t('close')}</button></div>`, o => {
      $('#cls', o).onclick = () => o.remove();
      $('#lcl', o).onclick = () => { if (confirm(t('logClearQ'))) { c.log = []; save(); o.remove(); } };
    });
  }

  function orderText(c) {
    return `${t('orderTitle')} – ${c.name}${c.addr ? ' (' + c.addr + ')' : ''}\n` +
      missing(c).map(m => `${m.need - m.have} × ${fmt(m.kg)} lb`).join('\n');
  }
  function showOrder(c) {
    const m = missing(c);
    modal(`<h3>⚠ ${t('missingTitle')}</h3><p class="muted">${t('missingInfo')}</p>
      <ul class="list">${m.map(x => `<li><span><b>${x.need - x.have} × ${fmt(x.kg)} lb</b></span><span class="muted small">${t('need')} ${x.need} · ${t('have')} ${x.have}</span></li>`).join('')}</ul>
      <div class="row"><button class="btn warnbtn" id="ord">${t('order')}</button><button class="btn" id="cls">${t('close')}</button></div>`, o => {
      $('#cls', o).onclick = () => o.remove();
      $('#ord', o).onclick = async () => {
        const txt = orderText(c);
        try { if (navigator.share) { await navigator.share({ title: t('orderTitle'), text: txt }); return; } } catch (e) { if (e.name === 'AbortError') return; }
        try { await navigator.clipboard.writeText(txt); toast(t('copied')); } catch (e) { prompt(t('orderTitle'), txt); }
      };
    });
  }

  // ---------- IMPOSTAZIONI ----------
  function renderSettings() {
    const langs = [['it', 'ITA'], ['de', 'GER'], ['es', 'SPA'], ['fr', 'FRA']];
    app.innerHTML = `${header()}
      <main class="settings">
        <h2>${t('settings')}</h2>
        <section class="card"><h3>${t('language')}</h3>
          <div class="langs">${langs.map(([k, n]) => `<label class="lang"><input type="radio" name="l" value="${k}" ${S.lang === k ? 'checked' : ''}><span>${n}</span></label>`).join('')}</div></section>
        <section class="card"><h3>${t('cranes')}</h3>
          <ul class="list">${S.cranes.map(c => `<li><span><b>${esc(c.name)}</b><br><span class="muted small">${esc(c.addr)}</span></span>
            <span class="pm"><button data-go="#/edit/${c.id}">${t('edit')}</button></span></li>`).join('')}</ul>
          <button class="btn" id="add">${t('addCrane')}</button></section>
        <section class="card"><h3>${t('backup')}</h3>
          <div class="row"><button class="btn" id="exp">${t('export')}</button><button class="btn" id="imp">${t('import')}</button></div>
          <input type="file" id="file" accept="application/json" hidden></section>
      </main>`;
    app.querySelectorAll('input[name=l]').forEach(r => r.addEventListener('change', () => { S.lang = r.value; save(); renderSettings(); }));
    $('#add').onclick = () => { const c = newCrane(t('newName') + ' ' + (S.cranes.length + 1)); draft = c; go('#/edit/' + c.id); };
    $('#exp').onclick = () => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' }));
      a.download = 'weight-reminder-backup.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    };
    $('#imp').onclick = () => $('#file').click();
    $('#file').onchange = async e => {
      try {
        const d = JSON.parse(await e.target.files[0].text());
        if (!Array.isArray(d.cranes) || typeof d.stock !== 'object') throw 0;
        S = d; save(); toast(t('importOk')); renderSettings();
      } catch (err) { toast(t('importKo')); }
    };
  }

  // ---------- MODIFICA GRU ----------
  function renderEdit(id) {
    const c = crane(id) || (draft && draft.id === id ? draft : null); if (!c) return renderHome();
    app.innerHTML = `${header()}
      <main class="settings">
        <h2>${t('editTitle')}</h2>
        <form id="f" class="card">
          <label>${t('name')}<input name="name" value="${esc(c.name)}" required></label>
          <label>${t('location')}<input name="addr" value="${esc(c.addr)}"></label>
          <h3>${t('weightsCrane')}</h3><p class="muted small">${t('layoutHelp')}</p>
          ${ZONES.filter(z => c.layout[z].length).map(z => `<label>${t('z_' + z)} (lb)<input name="${z}" value="${esc(c.layout[z].map(fmt).join(' '))}" inputmode="decimal"></label>`).join('')}
          <div class="row"><button class="btn primary">${t('save')}</button><button type="button" class="btn" id="cn">${t('cancel')}</button></div>
          <div class="row"><button type="button" class="btn" id="rs">${t('factoryReset')}</button><button type="button" class="btn danger" id="dl">${t('del')}</button></div>
        </form>
      </main>`;
    const back = () => go('#/crane/' + c.id);
    $('#cn').onclick = () => S.cranes.includes(c) ? back() : (draft = null, go('#/'));
    $('#rs').onclick = () => { if (confirm(t('confirmReset'))) { c.present = allPresent(c.layout); save(); back(); } };
    $('#dl').onclick = () => { if (confirm(t('confirmDel'))) { S.cranes = S.cranes.filter(x => x !== c); if (S.last === c.id) S.last = null; save(); go('#/settings'); } };
    $('#f').onsubmit = e => {
      e.preventDefault(); const f = new FormData(e.target);
      if (!S.cranes.includes(c)) { S.cranes.push(c); draft = null; }
      c.name = f.get('name').trim() || c.name; c.addr = f.get('addr').trim();
      ZONES.filter(z => c.layout[z].length).forEach(z => {
        const arr = String(f.get(z)).split(/[\s;]+/).map(s => Number(s.replace(',', '.'))).filter(n => n > 0);
        if (arr.length !== c.layout[z].length) return;   // il numero di pesi è fisso: dipende dal modello 3D
        if (JSON.stringify(arr) !== JSON.stringify(c.layout[z])) { c.layout[z] = arr; c.present[z] = arr.map(() => true); }
      });
      save(); back();
    };
  }

  render();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => { });
})();



