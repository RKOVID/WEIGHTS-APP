// Visualizzatore 3D WebGL (nessuna libreria, funziona offline).
// Legge un file .glb (Tinkercad), separa i pezzi della mesh e li associa alle zone/pesi dell'app.
(function () {
  // ---------- matematica ----------
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const mulS = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const len = a => Math.hypot(a[0], a[1], a[2]);
  const norm = a => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const mmul = (a, b) => { const o = new Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s; } return o; };
  const IDENT = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  const perspective = (f, asp, n, fr) => { const t = 1 / Math.tan(f / 2); return [t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (fr + n) / (n - fr), -1, 0, 0, 2 * fr * n / (n - fr), 0]; };
  const lookAt = (e, c, u) => { const f = norm(sub(c, e)), s = norm(cross(f, u)), v = cross(s, f); return [s[0], v[0], -f[0], 0, s[1], v[1], -f[1], 0, s[2], v[2], -f[2], 0, -dot(s, e), -dot(v, e), dot(f, e), 1]; };
  const xform = (m, p) => [m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]];
  const angDiff = (to, from) => ((to - from + Math.PI * 3) % (Math.PI * 2)) - Math.PI;

  // ---------- lettura GLB ----------
  function nodeMatrix(n) {
    if (n.matrix) return n.matrix;
    const t = n.translation || [0, 0, 0], q = n.rotation || [0, 0, 0, 1], s = n.scale || [1, 1, 1];
    const [x, y, z, w] = q;
    const r = [1 - 2 * (y * y + z * z), 2 * (x * y + z * w), 2 * (x * z - y * w), 0, 2 * (x * y - z * w), 1 - 2 * (x * x + z * z), 2 * (y * z + x * w), 0, 2 * (x * z + y * w), 2 * (y * z - x * w), 1 - 2 * (x * x + y * y), 0, 0, 0, 0, 1];
    for (let c = 0; c < 3; c++) for (let k = 0; k < 3; k++) r[c * 4 + k] *= s[c];
    r[12] = t[0]; r[13] = t[1]; r[14] = t[2];
    return r;
  }
  function readAcc(j, bin, dv, i) {
    const a = j.accessors[i], v = j.bufferViews[a.bufferView];
    const base = bin.start + (v.byteOffset || 0) + (a.byteOffset || 0);
    const nc = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[a.type];
    const cs = { 5126: 4, 5125: 4, 5123: 2, 5121: 1 }[a.componentType];
    const stride = v.byteStride || nc * cs, out = [];
    for (let k = 0; k < a.count; k++) {
      const row = [];
      for (let c = 0; c < nc; c++) {
        const o = base + k * stride + c * cs; let val = 0;
        if (a.componentType === 5126) val = dv.getFloat32(o, true);
        else if (a.componentType === 5125) val = dv.getUint32(o, true);
        else if (a.componentType === 5123) { val = dv.getUint16(o, true); if (a.normalized) val /= 65535; }
        else if (a.componentType === 5121) { val = dv.getUint8(o); if (a.normalized) val /= 255; }
        row.push(val);
      }
      out.push(nc === 1 ? row[0] : row);
    }
    return out;
  }
  function parseGLB(buf) {
    const dv = new DataView(buf);
    if (dv.getUint32(0, true) !== 0x46546C67) throw new Error('GLB non valido');
    let off = 12, j = null, bin = null;
    while (off < buf.byteLength) {
      const l = dv.getUint32(off, true), ty = dv.getUint32(off + 4, true), st = off + 8;
      if (ty === 0x4E4F534A) j = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, st, l)));
      else if (ty === 0x004E4942) bin = { start: st, len: l };
      off = st + l;
    }
    const tris = [];
    const emit = (mi, m) => {
      for (const pr of j.meshes[mi].primitives) {
        if (pr.mode !== undefined && pr.mode !== 4) continue;
        const P = readAcc(j, bin, dv, pr.attributes.POSITION);
        const C = pr.attributes.COLOR_0 !== undefined ? readAcc(j, bin, dv, pr.attributes.COLOR_0) : null;
        const I = pr.indices !== undefined ? readAcc(j, bin, dv, pr.indices) : P.map((_, k) => k);
        for (let k = 0; k + 2 < I.length; k += 3) {
          const c = C ? C[I[k]] : [0.7, 0.7, 0.7];
          tris.push({ p: [xform(m, P[I[k]]), xform(m, P[I[k + 1]]), xform(m, P[I[k + 2]])], c: [c[0], c[1], c[2]] });
        }
      }
    };
    const walk = (ni, parent) => {
      const n = j.nodes[ni], m = mmul(parent, nodeMatrix(n));
      if (n.mesh !== undefined) emit(n.mesh, m);
      (n.children || []).forEach(c => walk(c, m));
    };
    (j.scenes[j.scene || 0].nodes).forEach(n => walk(n, IDENT));
    return tris;
  }

  // ---------- separazione in pezzi + riconoscimento ----------
  function buildModel(tris) {
    // normalizza: centrato, lato massimo = 6
    const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
    tris.forEach(t => t.p.forEach(p => p.forEach((v, k) => { mn[k] = Math.min(mn[k], v); mx[k] = Math.max(mx[k], v); })));
    const ctr = [0, 1, 2].map(k => (mn[k] + mx[k]) / 2), sc = 6 / Math.max(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]);
    tris.forEach(t => { t.p = t.p.map(p => [(p[0] - ctr[0]) * sc, (p[1] - ctr[1]) * sc, (p[2] - ctr[2]) * sc]); });
    // pezzi = componenti connesse (stessi vertici)
    const key = p => p.map(v => v.toFixed(3)).join(',');
    const parent = new Map();
    const find = x => { while (parent.get(x) !== x) { parent.set(x, parent.get(parent.get(x))); x = parent.get(x); } return x; };
    tris.forEach(t => t.k = t.p.map(key));
    tris.forEach(t => t.k.forEach(k => { if (!parent.has(k)) parent.set(k, k); }));
    tris.forEach(t => { const a = find(t.k[0]); [t.k[1], t.k[2]].forEach(k => parent.set(find(k), a)); });
    const map = new Map(), comps = [];
    tris.forEach(t => {
      const r = find(t.k[0]);
      if (!map.has(r)) { map.set(r, comps.length); comps.push({ tris: [], mn: [1e9, 1e9, 1e9], mx: [-1e9, -1e9, -1e9], color: t.c }); }
      const c = comps[map.get(r)]; c.tris.push(t);
      t.p.forEach(p => p.forEach((v, k) => { c.mn[k] = Math.min(c.mn[k], v); c.mx[k] = Math.max(c.mx[k], v); }));
    });
    comps.forEach(c => { c.ctr = [0, 1, 2].map(k => (c.mn[k] + c.mx[k]) / 2); c.size = [0, 1, 2].map(k => c.mx[k] - c.mn[k]); c.nv = c.tris.length * 3; });
    // riconoscimento: pezzi colorati = pesi, bianchi = struttura
    const isW = c => Math.max(...c.color) - Math.min(...c.color) > 0.3;
    const st = comps.filter(c => !isW(c));
    const sMin = [0, 1, 2].map(k => Math.min(...st.map(c => c.mn[k]))), sMax = [0, 1, 2].map(k => Math.max(...st.map(c => c.mx[k])));
    const sCtr = [0, 1, 2].map(k => (sMin[k] + sMax[k]) / 2);
    const zones = { col_dx: [], col_sx: [], beam_dx: [], beam_sx: [], beam_top: [] };
    comps.forEach((c, i) => {
      c.weight = false;
      if (!isW(c)) return;
      const th = c.size.indexOf(Math.min(...c.size));
      if (th === 2) return;                       // pezzo non riconosciuto: resta come struttura
      const sg = c.ctr[th] >= sCtr[th] ? 1 : -1;
      c.contactN = [0, 0, 0]; c.contactN[th] = sg; c.th = th; c.weight = true;
      let z;
      if (th === 1) z = 'beam_top';
      else if (c.nv > 150) z = sg > 0 ? 'col_dx' : 'col_sx';   // cuori sulla colonna
      else z = sg > 0 ? 'beam_dx' : 'beam_sx';                 // rettangoli sul lato trave
      zones[z].push(i);
    });
    zones.beam_top.sort((a, b) => comps[a].ctr[0] - comps[b].ctr[0]);
    ['col_dx', 'col_sx'].forEach(z => zones[z].sort((a, b) => comps[a].ctr[1] - comps[b].ctr[1]));      // dal basso verso l'alto
    ['beam_dx', 'beam_sx'].forEach(z => zones[z].sort((a, b) => comps[a].size[2] - comps[b].size[2] || comps[a].ctr[2] - comps[b].ctr[2])); // piccolo, poi lunghi
    const slotOf = {};
    for (const z in zones) zones[z].forEach((ci, s) => { comps[ci].zone = z; comps[ci].slot = s; });

    // buffer triangoli (normali piatte) e spigoli "vivi"
    const P = [], N = [], E = [];
    comps.forEach(c => {
      c.first = P.length / 3;
      const em = new Map();
      c.tris.forEach(t => {
        const n = norm(cross(sub(t.p[1], t.p[0]), sub(t.p[2], t.p[0]))); t.n = n;
        t.p.forEach(p => { P.push(p[0], p[1], p[2]); N.push(n[0], n[1], n[2]); });
        for (let e = 0; e < 3; e++) {
          const ka = t.k[e], kb = t.k[(e + 1) % 3], kk = ka < kb ? ka + '|' + kb : kb + '|' + ka;
          if (!em.has(kk)) em.set(kk, { a: t.p[e], b: t.p[(e + 1) % 3], ns: [] });
          em.get(kk).ns.push(n);
        }
      });
      c.count = P.length / 3 - c.first; c.efirst = E.length / 3;
      em.forEach(e => {
        const sharp = e.ns.length < 2 || e.ns.some(n => dot(n, e.ns[0]) < 0.85);
        if (sharp) E.push(e.a[0], e.a[1], e.a[2], e.b[0], e.b[1], e.b[2]);
      });
      c.ecount = E.length / 3 - c.efirst;
      // triangoli piatti per raycast
      c.flat = new Float32Array(c.tris.length * 9);
      c.tris.forEach((t, i) => { t.p.forEach((p, k) => { c.flat[i * 9 + k * 3] = p[0]; c.flat[i * 9 + k * 3 + 1] = p[1]; c.flat[i * 9 + k * 3 + 2] = p[2]; }); });
    });
    return { comps, zones, P: new Float32Array(P), N: new Float32Array(N), E: new Float32Array(E) };
  }

  // ---------- raycast ----------
  function rayComp(o, d, c, maxT) {
    const f = c.flat; let best = Infinity;
    for (let i = 0; i < f.length; i += 9) {
      const e1x = f[i + 3] - f[i], e1y = f[i + 4] - f[i + 1], e1z = f[i + 5] - f[i + 2];
      const e2x = f[i + 6] - f[i], e2y = f[i + 7] - f[i + 1], e2z = f[i + 8] - f[i + 2];
      const px = d[1] * e2z - d[2] * e2y, py = d[2] * e2x - d[0] * e2z, pz = d[0] * e2y - d[1] * e2x;
      const det = e1x * px + e1y * py + e1z * pz; if (Math.abs(det) < 1e-10) continue;
      const inv = 1 / det, tx = o[0] - f[i], ty = o[1] - f[i + 1], tz = o[2] - f[i + 2];
      const u = (tx * px + ty * py + tz * pz) * inv; if (u < 0 || u > 1) continue;
      const qx = ty * e1z - tz * e1y, qy = tz * e1x - tx * e1z, qz = tx * e1y - ty * e1x;
      const v = (d[0] * qx + d[1] * qy + d[2] * qz) * inv; if (v < 0 || u + v > 1) continue;
      const t = (e2x * qx + e2y * qy + e2z * qz) * inv;
      if (t > 1e-4 && t < best && t < maxT) best = t;
    }
    return best;
  }

  const PRESETS = { dx: { yaw: Math.PI / 2 - 0.5, elev: 0.3 }, sx: { yaw: -Math.PI / 2 + 0.5, elev: 0.3 }, top: { yaw: Math.PI / 2, elev: 1.35 } };
  const DIST0 = 11, FOV = 0.61;
  const VS = 'attribute vec3 aPos;attribute vec3 aNrm;uniform mat4 uMVP;varying float vL;void main(){gl_Position=uMVP*vec4(aPos,1.0);vL=0.55+0.45*abs(dot(normalize(aNrm),normalize(vec3(0.4,0.8,0.5))));}';
  const FS = 'precision mediump float;uniform vec3 uColor;uniform float uAlpha;uniform float uUnlit;varying float vL;void main(){float l=mix(vL,1.0,uUnlit);gl_FragColor=vec4(uColor*l,uAlpha);}';
  const BLUE = [0.86, 0.66, 0.1], NAVY = [0.42, 0.3, 0.02], ORANGE = [0.1, 0.5, 1], DARK = [0.3, 0.31, 0.34];

  class CraneView {
    constructor(canvas, overlay, onTap, opts) {
      Object.assign(this, { cv: canvas, ov: overlay, onTap, opts: opts || {} });
      this.yaw = PRESETS.dx.yaw; this.elev = PRESETS.dx.elev; this.dist = DIST0; this.target = [0, 0, 0];
      this.vy = 0; this.ve = 0; this.anim = null; this.zonesData = {}; this.sel = { zone: null, slot: -1 };
      this.ptrs = new Map(); this.raf = 0; this.drag = false; this.model = null;
      this._bind();
      this.ro = new ResizeObserver(() => this.request()); this.ro.observe(canvas);
      this._init(this.opts.model);
    }
    async _init(url) {
      try {
        const gl = this.gl = this.cv.getContext('webgl', { antialias: true, alpha: false });
        if (!gl) throw new Error('WebGL non disponibile');
        const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
        const pg = this.pg = gl.createProgram(); gl.attachShader(pg, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pg, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pg);
        if (!gl.getProgramParameter(pg, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pg));
        this.loc = { pos: gl.getAttribLocation(pg, 'aPos'), nrm: gl.getAttribLocation(pg, 'aNrm'), mvp: gl.getUniformLocation(pg, 'uMVP'), col: gl.getUniformLocation(pg, 'uColor'), alpha: gl.getUniformLocation(pg, 'uAlpha'), unlit: gl.getUniformLocation(pg, 'uUnlit') };
        const res = await fetch(url); if (!res.ok) throw new Error('modello non trovato');
        this.model = buildModel(parseGLB(await res.arrayBuffer()));
        const mk = d => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, d, gl.STATIC_DRAW); return b; };
        this.bP = mk(this.model.P); this.bN = mk(this.model.N); this.bE = mk(this.model.E);
        this.opts.onReady && this.opts.onReady(this.model);
        this.request();
      } catch (e) { this.error = e; this._drawError(); }
    }
    _drawError() {
      const ctx = this.ov.getContext('2d'); this.ov.width = this.ov.clientWidth; this.ov.height = this.ov.clientHeight;
      ctx.fillStyle = '#c62828'; ctx.font = '600 15px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Modello 3D non disponibile', this.ov.width / 2, this.ov.height / 2);
    }
    destroy() { this.ro.disconnect(); cancelAnimationFrame(this.raf); this.dead = true; }
    slotCount(zone) { return this.model ? this.model.zones[zone].length : null; }
    setZones(z) { this.zonesData = z; this.request(); }
    select(zone, slot) { this.sel = { zone, slot: slot ?? -1 }; this.request(); }
    request() { if (!this.raf && !this.dead) this.raf = requestAnimationFrame(() => { this.raf = 0; this._frame(); }); }
    animateTo(o) { this.anim = Object.assign({}, o); this.vy = this.ve = 0; this.request(); }
    preset(name) {
      if (name === 'reset') return this.animateTo({ yaw: PRESETS.dx.yaw, elev: PRESETS.dx.elev, dist: DIST0, target: [0, 0, 0] });
      const p = PRESETS[name]; this.animateTo({ yaw: p.yaw, elev: p.elev, dist: DIST0, target: [0, 0, 0] });
    }
    focus(zone) {
      if (!this.model) return; const ids = this.model.zones[zone]; if (!ids || !ids.length) return;
      const cs = ids.map(i => this.model.comps[i]);
      const mn = [0, 1, 2].map(k => Math.min(...cs.map(c => c.mn[k]))), mx = [0, 1, 2].map(k => Math.max(...cs.map(c => c.mx[k])));
      const ext = Math.max(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]), n = cs[0].contactN;
      const tg = [0, 1, 2].map(k => (mn[k] + mx[k]) / 2), dist = Math.max(3, Math.min(9, ext * 1.6 + 2.2));
      if (n[1] > 0.5) this.animateTo({ yaw: Math.PI / 2, elev: 1.35, dist, target: tg });
      else this.animateTo({ yaw: Math.atan2(n[0], n[2]) + (n[0] > 0 ? -0.5 : 0.5), elev: 0.3, dist, target: tg });
    }
    zoom(f) { this.dist = Math.max(1.5, Math.min(20, this.dist * f)); this.anim = null; this.request(); }

    // --- camera ---
    _camera() {
      const ce = Math.cos(this.elev), d = [ce * Math.sin(this.yaw), Math.sin(this.elev), ce * Math.cos(this.yaw)];
      const eye = add(this.target, mulS(d, this.dist)), W = this.W || 1, H = this.H || 1;
      const f = mulS(d, -1), right = norm(cross(f, [0, 1, 0])), up = cross(right, f);
      const VP = mmul(perspective(FOV, W / H, 0.3, 80), lookAt(eye, this.target, [0, 1, 0]));
      return { d, eye, f, right, up, VP };
    }
    _ray(x, y) {
      const c = this._camera(), th = Math.tan(FOV / 2), ndx = (x / this.W) * 2 - 1, ndy = 1 - (y / this.H) * 2;
      return { o: c.eye, d: norm(add(add(c.f, mulS(c.right, ndx * th * this.W / this.H)), mulS(c.up, ndy * th))) };
    }
    _tap(x, y) {
      if (!this.model) return; const r = this._ray(x, y); let best = Infinity, hit = -1;
      this.model.comps.forEach((c, i) => { const t = rayComp(r.o, r.d, c, best); if (t < best) { best = t; hit = i; } });
      const c = hit >= 0 ? this.model.comps[hit] : null;
      if (c && c.weight) this.onTap && this.onTap(c.zone, c.slot); else this.onTap && this.onTap(null, -1);
    }

    // --- interazione ---
    _bind() {
      const cv = this.cv; cv.style.touchAction = 'none';
      cv.addEventListener('pointerdown', e => {
        cv.setPointerCapture(e.pointerId);
        this.ptrs.set(e.pointerId, { x: e.pageX, y: e.pageY, sx: e.pageX, sy: e.pageY });
        this.drag = false; this.vy = this.ve = 0; this.anim = null;
      });
      cv.addEventListener('pointermove', e => {
        const p = this.ptrs.get(e.pointerId); if (!p) return;
        const dx = e.pageX - p.x, dy = e.pageY - p.y;
        if (this.ptrs.size === 1) {
          if (Math.hypot(e.pageX - p.sx, e.pageY - p.sy) > 6) this.drag = true;
          if (this.drag) {
            this.yaw -= dx * 0.007; this.elev = Math.max(-1.45, Math.min(1.45, this.elev + dy * 0.007));
            this.vy = -dx * 0.007; this.ve = dy * 0.007;
          }
        } else if (this.ptrs.size === 2) {
          this.drag = true; this.vy = this.ve = 0;
          const o = [...this.ptrs.entries()].find(([id]) => id !== e.pointerId)[1];
          const d0 = Math.hypot(p.x - o.x, p.y - o.y), d1 = Math.hypot(e.pageX - o.x, e.pageY - o.y);
          if (d0 > 5 && d1 > 5) this.dist = Math.max(1.5, Math.min(20, this.dist * d0 / d1));
          const k = 2 * Math.tan(FOV / 2) * this.dist / (this.H || 400) * 0.5, c = this._camera();
          this.target = this.target.map((v, i) => v - c.right[i] * dx * k + c.up[i] * dy * k);
        }
        p.x = e.pageX; p.y = e.pageY; this.request();
      });
      const end = e => {
        const p = this.ptrs.get(e.pointerId); if (!p) return;
        const single = this.ptrs.size === 1; this.ptrs.delete(e.pointerId);
        if (single && !this.drag && e.type === 'pointerup') { const r = cv.getBoundingClientRect(); this._tap(e.clientX - r.left, e.clientY - r.top); }
        else if (single && this.drag) this.request();
      };
      cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
      cv.addEventListener('wheel', e => { e.preventDefault(); this.zoom(Math.exp(e.deltaY * 0.0012)); }, { passive: false });
    }

    // --- render ---
    _frame() {
      let again = false;
      if (this.anim) {
        const a = this.anim, k = 0.16;
        this.yaw += angDiff(a.yaw, this.yaw) * k; this.elev += (a.elev - this.elev) * k; this.dist += (a.dist - this.dist) * k;
        this.target = this.target.map((v, i) => v + (a.target[i] - v) * k);
        const done = Math.abs(angDiff(a.yaw, this.yaw)) < 0.003 && Math.abs(a.elev - this.elev) < 0.003 && Math.abs(a.dist - this.dist) < 0.01 && this.target.every((v, i) => Math.abs(a.target[i] - v) < 0.01);
        if (done) { this.yaw = a.yaw; this.elev = a.elev; this.dist = a.dist; this.target = a.target.slice(); this.anim = null; } else again = true;
      } else if (this.ptrs.size === 0 && (Math.abs(this.vy) > 0.0004 || Math.abs(this.ve) > 0.0004)) {
        this.yaw += this.vy; this.elev = Math.max(-1.45, Math.min(1.45, this.elev + this.ve));
        this.vy *= 0.95; this.ve *= 0.95; again = true;      // inerzia lenta e fluida
      }
      this._draw(); if (again) this.request();
    }
    _draw() {
      const gl = this.gl, m = this.model; if (!gl || !m) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2), r = this.cv.getBoundingClientRect();
      this.W = Math.max(50, r.width); this.H = Math.max(50, r.height);
      const pw = Math.round(this.W * dpr), ph = Math.round(this.H * dpr);
      if (this.cv.width !== pw || this.cv.height !== ph) { this.cv.width = pw; this.cv.height = ph; this.ov.width = pw; this.ov.height = ph; }
      const cam = this._camera(), L = this.loc;
      gl.viewport(0, 0, pw, ph); gl.clearColor(0.89, 0.885, 0.87, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST); gl.useProgram(this.pg); gl.uniformMatrix4fv(L.mvp, false, new Float32Array(cam.VP));
      gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(1, 1);
      const stateOf = c => { const z = this.zonesData[c.zone]; return z ? !!z.present[c.slot] : true; };
      const selSet = new Set(this.sel.zone && m.zones[this.sel.zone] || []);
      const bindTri = () => {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bP); gl.enableVertexAttribArray(L.pos); gl.vertexAttribPointer(L.pos, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bN); gl.enableVertexAttribArray(L.nrm); gl.vertexAttribPointer(L.nrm, 3, gl.FLOAT, false, 0, 0);
      };
      const fill = (c, col, a) => { gl.uniform3fv(L.col, col); gl.uniform1f(L.alpha, a); gl.uniform1f(L.unlit, 0); gl.drawArrays(gl.TRIANGLES, c.first, c.count); };
      bindTri(); gl.disable(gl.BLEND); gl.depthMask(true);
      const removed = [];
      m.comps.forEach((c, i) => {
        if (!c.weight) { fill(c, c.color, 1); return; }
        if (!stateOf(c)) { removed.push(c); return; }
        const sel = this.sel.zone === c.zone && this.sel.slot === c.slot;
        fill(c, sel ? ORANGE : BLUE, 1);
      });
      gl.disable(gl.POLYGON_OFFSET_FILL);
      // pesi rimossi: trasparenti
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
      removed.forEach(c => { const sel = this.sel.zone === c.zone && this.sel.slot === c.slot; fill(c, sel ? ORANGE : BLUE, sel ? 0.45 : 0.14); });
      gl.depthMask(true); gl.disable(gl.BLEND);
      // spigoli
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bE); gl.vertexAttribPointer(L.pos, 3, gl.FLOAT, false, 0, 0);
      gl.disableVertexAttribArray(L.nrm); gl.vertexAttrib3f(L.nrm, 0, 1, 0); gl.uniform1f(L.unlit, 1); gl.uniform1f(L.alpha, 1);
      m.comps.forEach((c, i) => {
        let col = DARK;
        if (c.weight) col = selSet.has(i) ? ORANGE : (stateOf(c) ? NAVY : BLUE);
        gl.uniform3fv(L.col, col); gl.drawArrays(gl.LINES, c.efirst, c.ecount);
      });
      gl.enableVertexAttribArray(L.nrm);
      this._labels(cam, dpr);
    }
    _labels(cam, dpr) {
      const ctx = this.ov.getContext('2d'), W = this.W, H = this.H, m = this.model;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const th = Math.tan(FOV / 2);
      m.comps.forEach((c, i) => {
        if (!c.weight) return;
        const z = this.zonesData[c.zone]; if (!z) return;
        const thick = c.size[c.th], P = add(c.ctr, mulS(c.contactN, thick / 2 + 0.005));
        const v = sub(cam.eye, P), dist = len(v), vn = mulS(v, 1 / dist);
        const facing = dot(c.contactN, vn); if (facing < 0.25) return;
        // occlusione: qualcosa tra occhio e etichetta?
        const dir = mulS(vn, -1);
        for (let k = 0; k < m.comps.length; k++) { if (k === i) continue; if (rayComp(cam.eye, dir, m.comps[k], dist - 0.03) < Infinity) return; }
        const clip = [0, 1, 2, 3].map(r => cam.VP[r] * P[0] + cam.VP[4 + r] * P[1] + cam.VP[8 + r] * P[2] + cam.VP[12 + r]);
        if (clip[3] <= 0) return;
        const sx = (clip[0] / clip[3] * 0.5 + 0.5) * W, sy = (1 - (clip[1] / clip[3] * 0.5 + 0.5)) * H;
        const ppu = H / (2 * th * dist), ext = c.size.filter((_, k) => k !== c.th);
        const lab = this.opts.label ? this.opts.label(c.zone, c.slot) : ['', ''];
        const minE = Math.min(...ext) * ppu * Math.min(1, facing * 1.4), maxE = Math.max(...ext) * ppu;
        const fit = s => Math.min(22, minE * 0.55, maxE * 0.9 / (s.length * 0.6));
        let txt = lab[1], fs = fit(txt);
        if (fs < 10) { txt = lab[0]; fs = fit(txt); }
        if (fs < 8) return;
        const sel = this.sel.zone === c.zone && this.sel.slot === c.slot, present = z.present[c.slot];
        ctx.font = `700 ${fs}px -apple-system, Segoe UI, sans-serif`;
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.0)';
        ctx.fillStyle = sel ? '#fff' : (present ? '#2b2100' : '#7a5a00');
        ctx.fillText(txt, sx, sy);
      });
    }
  }
  window.CraneView = CraneView;
})();
