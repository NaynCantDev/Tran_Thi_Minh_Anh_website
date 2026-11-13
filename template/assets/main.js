/* Portfolio Trần Thị Minh Anh — "Recital"
   Âm thanh tổng hợp hoàn toàn bằng Web Audio (không cần file). */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* ================= AUDIO ================= */
  let ctx = null, master = null, soundOn = store.get("ma-sound") !== "off";
  const midiHz = m => 440 * Math.pow(2, (m - 69) / 12);

  function audio() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18; comp.ratio.value = 4;
      master = ctx.createGain();
      master.gain.value = soundOn ? 0.9 : 0;
      master.connect(comp).connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  const ready = () => ctx && ctx.state === "running" && soundOn;
  ["pointerdown", "keydown"].forEach(ev => addEventListener(ev, () => audio(), { once: true, passive: true }));

  // Formant (nữ, gần đúng) cho các nguyên âm: [tần số, độ lớn, Q]
  const VOWELS = {
    a: [[850, 1, 8], [1220, .55, 10], [2810, .25, 14]],
    o: [[500, 1, 8], [900, .5, 10], [2830, .14, 14]],
    u: [[350, 1, 8], [780, .32, 10], [2700, .1, 14]],
    i: [[320, 1, 8], [2750, .4, 14], [3300, .22, 14]]
  };

  /** Giọng "a/o/u/i" có vibrato: sóng răng cưa qua 3 bộ lọc formant. */
  function sing(freq, t0, dur, vol = .5, vowel = "a", bus, path) {
    const c = audio(); if (!c) return;
    const out = bus || master;
    const t = Math.max(t0, c.currentTime);
    const env = c.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(vol, t + .09);
    env.gain.setValueAtTime(vol, t + Math.max(.1, dur - .12));
    env.gain.linearRampToValueAtTime(0, t + dur + .08);
    env.connect(out);

    const osc = c.createOscillator(), osc2 = c.createOscillator();
    osc.type = "sawtooth"; osc2.type = "sawtooth";
    osc.frequency.setValueAtTime(freq, t);
    osc2.frequency.setValueAtTime(freq, t); osc2.detune.value = 7;
    // path: [[giây, Hz], ...] để trượt cao độ (glissando)
    if (path) path.forEach(([dt, f]) => { osc.frequency.linearRampToValueAtTime(f, t + dt); osc2.frequency.linearRampToValueAtTime(f, t + dt); });
    const lfo = c.createOscillator(), depth = c.createGain();
    lfo.frequency.value = 5.4;
    depth.gain.setValueAtTime(0, t);
    depth.gain.linearRampToValueAtTime(freq * .011, t + Math.min(.35, dur * .6));
    lfo.connect(depth); depth.connect(osc.frequency); depth.connect(osc2.frequency);

    const pre = c.createGain(); pre.gain.value = .5;
    osc.connect(pre); osc2.connect(pre);
    (VOWELS[vowel] || VOWELS.a).forEach(([f, g, q]) => {
      const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = f; bp.Q.value = q;
      const gg = c.createGain(); gg.gain.value = g * 3.2;
      pre.connect(bp).connect(gg).connect(env);
    });
    [osc, osc2, lfo].forEach(o => { o.start(t); o.stop(t + dur + .15); });
  }

  /** Tiếng đàn piano đơn giản. */
  function pluck(freq, t0, dur = 1.2, vol = .28, bus) {
    const c = audio(); if (!c) return;
    const out = bus || master;
    const t = Math.max(t0, c.currentTime);
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + .008);
    g.gain.exponentialRampToValueAtTime(vol * .35, t + .25);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.setValueAtTime(4200, t); lp.frequency.exponentialRampToValueAtTime(900, t + dur);
    g.connect(lp).connect(out);
    [[1, "triangle", 1], [2, "sine", .35], [3, "sine", .12]].forEach(([m, type, a]) => {
      const o = c.createOscillator(), og = c.createGain();
      o.type = type; o.frequency.value = freq * m; og.gain.value = a;
      o.connect(og).connect(g); o.start(t); o.stop(t + dur + .05);
    });
  }

  /* Nút bật/tắt âm thanh */
  const sndBtn = $("#sndBtn");
  function paintSnd() {
    if (!sndBtn) return;
    sndBtn.setAttribute("aria-pressed", soundOn);
    $(".snd-t", sndBtn).textContent = "Âm thanh: " + (soundOn ? "bật" : "tắt");
  }
  paintSnd();
  sndBtn && sndBtn.addEventListener("click", () => {
    soundOn = !soundOn; store.set("ma-sound", soundOn ? "on" : "off"); paintSnd();
    if (audio()) master.gain.setTargetAtTime(soundOn ? .9 : 0, ctx.currentTime, .05);
  });

  /* ================= NAV (mobile) ================= */
  const rail = $("#rail"), mbtn = $(".mbtn"), scrim = $(".scrim");
  function setNav(open) {
    rail.classList.toggle("open", open); scrim.classList.toggle("on", open);
    mbtn && mbtn.setAttribute("aria-expanded", open);
  }
  mbtn && mbtn.addEventListener("click", () => setNav(!rail.classList.contains("open")));
  scrim && scrim.addEventListener("click", () => setNav(false));
  addEventListener("keydown", e => { if (e.key === "Escape") setNav(false); });

  /* ================= REVEAL ================= */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }), { threshold: .15, rootMargin: "0px 0px -40px 0px" });
  $$(".reveal, .cresc").forEach(el => io.observe(el));

  /* ================= KHUÔNG NHẠC TƯƠNG TÁC (hero) ================= */
  const SOL = ["Đô", "Rê", "Mi", "Fa", "Son", "La", "Si"];
  const MAJ = [0, 2, 4, 5, 7, 9, 11];
  // p = vị trí trên khuông, 0 = dòng kẻ dưới cùng (Mi4)
  const posMidi = p => { const s = p + 2, o = Math.floor(s / 7), d = ((s % 7) + 7) % 7; return 60 + 12 * o + MAJ[d]; };
  const posSol = p => SOL[(((p + 2) % 7) + 7) % 7];

  const cv = $("#staffCanvas");
  if (cv) {
    const g = cv.getContext("2d"), bar = $("#staffbar"), hint = $("#staffHint");
    let W = 0, H = 0, dpr = 1, gap = 14, base = 0, ghost = null, down = false, lastP = null;
    const notes = [];
    // vài nốt trang trí trôi chậm
    const drift = Array.from({ length: 9 }, (_, i) => ({ x: i / 9, p: [1, 3, 5, 2, 6, 4, 7, 3, 5][i], a: .22 }));

    function size() {
      dpr = Math.min(2, devicePixelRatio || 1);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      gap = Math.max(11, Math.min(16, H / 9));
      base = H / 2 + gap * 2;
    }
    const yOf = p => base - p * gap / 2;
    function head(x, y, r, fill, alpha, stemUp = true) {
      g.save(); g.globalAlpha = alpha; g.fillStyle = fill;
      g.translate(x, y); g.rotate(-.35);
      g.beginPath(); g.ellipse(0, 0, r * 1.3, r * .92, 0, 0, Math.PI * 2); g.fill();
      g.restore();
      g.save(); g.globalAlpha = alpha; g.strokeStyle = fill; g.lineWidth = 1.6;
      g.beginPath();
      if (stemUp) { g.moveTo(x + r * 1.15, y - 2); g.lineTo(x + r * 1.15, y - gap * 3.2); }
      else { g.moveTo(x - r * 1.15, y + 2); g.lineTo(x - r * 1.15, y + gap * 3.2); }
      g.stroke(); g.restore();
    }
    function ledgers(x, p, alpha) {
      g.save(); g.globalAlpha = alpha; g.strokeStyle = "#8a6436"; g.lineWidth = 1.2;
      for (let q = -2; q >= p; q -= 2) { g.beginPath(); g.moveTo(x - 13, yOf(q)); g.lineTo(x + 13, yOf(q)); g.stroke(); }
      for (let q = 10; q <= p; q += 2) { g.beginPath(); g.moveTo(x - 13, yOf(q)); g.lineTo(x + 13, yOf(q)); g.stroke(); }
      g.restore();
    }
    let last = performance.now();
    function frame(now) {
      const dt = Math.min(50, now - last) / 1000; last = now;
      g.clearRect(0, 0, W, H);
      // 5 dòng kẻ, hơi "thở"
      for (let i = 0; i < 5; i++) {
        g.beginPath(); g.strokeStyle = "rgba(138,100,54,.45)"; g.lineWidth = 1;
        const y0 = yOf(i * 2);
        for (let x = 0; x <= W; x += 24) {
          const y = y0 + (reduce ? 0 : Math.sin(x / 140 + now / 1600 + i * .5) * 1.4);
          x ? g.lineTo(x, y) : g.moveTo(x, y);
        }
        g.stroke();
      }
      drift.forEach(n => {
        if (!reduce) n.x -= dt * .012; if (n.x < -.05) n.x += 1.1;
        head(n.x * W, yOf(n.p), gap * .42, "#b9a1d6", n.a, n.p < 4);
      });
      for (let i = notes.length - 1; i >= 0; i--) {
        const n = notes[i];
        n.life -= dt * .22; if (!reduce) n.x -= dt * 28;
        if (n.life <= 0 || n.x < -30) { notes.splice(i, 1); continue; }
        const a = Math.min(1, n.life * 1.5);
        ledgers(n.x, n.p, a);
        g.save(); g.shadowColor = "#5b4a8b"; g.shadowBlur = 14 * a;
        head(n.x, yOf(n.p), gap * .48, "#5b4a8b", a, n.p < 4);
        g.restore();
        g.save(); g.globalAlpha = a; g.fillStyle = "#8a6436"; g.font = "italic 500 17px Cormorant, Georgia, serif"; g.textAlign = "center";
        g.fillText(n.lbl, n.x, n.p < 4 ? yOf(n.p) + gap * 1.8 : yOf(n.p) - gap * 1.4); g.restore();
      }
      if (ghost) { ledgers(ghost.x, ghost.p, .35); head(ghost.x, yOf(ghost.p), gap * .48, "#2a1f2f", .22, ghost.p < 4); }
      requestAnimationFrame(frame);
    }
    function pFromY(y) { return Math.max(-3, Math.min(11, Math.round((base - y) / (gap / 2)))); }
    function local(e) { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    function hit(x, p) {
      notes.push({ x, p, life: 1, lbl: posSol(p) });
      if (notes.length > 40) notes.shift();
      audio(); if (soundOn) sing(midiHz(posMidi(p)), ctx.currentTime, .7, .42, "a");
      hint && (hint.style.opacity = 0);
    }
    bar.addEventListener("pointermove", e => {
      const { x, y } = local(e), p = pFromY(y);
      ghost = { x, p };
      if (down && p !== lastP) { lastP = p; hit(x, p); }
    });
    bar.addEventListener("pointerleave", () => { ghost = null; down = false; });
    bar.addEventListener("pointerdown", e => {
      const { x, y } = local(e), p = pFromY(y); down = true; lastP = p; hit(x, p);
      bar.setPointerCapture && bar.setPointerCapture(e.pointerId);
    });
    addEventListener("pointerup", () => { down = false; });
    size(); addEventListener("resize", size); requestAnimationFrame(frame);
  }

  /* ================= VOCALISE ================= */
  const staff = $("#vocStaff");
  if (staff) {
    const KEYS = ["Đô", "Rê giáng", "Rê", "Mi giáng", "Mi", "Fa", "Son giáng", "Son", "La giáng", "La"];
    const LETTER = [0, 1, 1, 2, 2, 3, 4, 4, 5, 5];               // C D D E E F G G A A
    const SIG = { 0: [], 1: ["b", 5], 2: ["#", 2], 3: ["b", 3], 4: ["#", 4], 5: ["b", 1], 6: ["b", 6], 7: ["#", 1], 8: ["b", 4], 9: ["#", 3] };
    const SHARP_P = [8, 5, 9, 6, 3, 7, 4], FLAT_P = [4, 7, 3, 6, 2, 5, 1];
    const PATS = { scale5: [0, 1, 2, 3, 4, 3, 2, 1, 0], arp: [0, 2, 4, 7, 4, 2, 0], octave: [0, 7, 4, 2, 0] };
    const DEG = [0, 2, 4, 5, 7, 9, 11, 12];
    const SOLM = ["Đô", "Rê", "Mi", "Fa", "Son", "La", "Si", "Đô"];
    const NS = "http://www.w3.org/2000/svg";
    const keyOut = $("#keyOut"), roundEl = $("#vocRound"), keyEl = $("#vocKey"), syl = $("#vocSyl"), playBtn = $("#vocPlay");
    let start = 0, running = false, timers = [], bus = null, nodes = [];
    const val = n => ($(`input[name=${n}]:checked`) || {}).value;
    const keyName = k => KEYS[k] + " trưởng";
    const rounds = () => Math.min(4, 10 - start);
    const gapS = 16, top = 40, baseY = top + gapS * 4; // dòng kẻ dưới cùng
    const yP = p => baseY - p * gapS / 2;

    function el(tag, attrs, parent) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent && parent.appendChild(e); return e; }
    function draw(key) {
      staff.innerHTML = ""; nodes = [];
      for (let i = 0; i < 5; i++) el("line", { x1: 0, x2: 640, y1: yP(i * 2), y2: yP(i * 2), class: "ln" }, staff);
      const [kind, count] = SIG[key].length ? SIG[key] : ["", 0];
      for (let i = 0; i < count; i++) {
        const p = (kind === "#" ? SHARP_P : FLAT_P)[i];
        const t = el("text", { x: 18 + i * 12, y: yP(p) + 6, class: "acc" }, staff); t.textContent = kind === "#" ? "♯" : "♭";
      }
      const pat = PATS[val("pat")], L = LETTER[key];
      const x0 = 40 + count * 12 + 28, step = (640 - x0 - 30) / (pat.length - 1 || 1);
      syl.innerHTML = "";
      pat.forEach((d, i) => {
        const p = L + d - 2, x = x0 + i * step, y = yP(p);
        for (let q = -2; q >= p; q -= 2) el("line", { x1: x - 14, x2: x + 14, y1: yP(q), y2: yP(q), class: "ln" }, staff);
        for (let q = 10; q <= p; q += 2) el("line", { x1: x - 14, x2: x + 14, y1: yP(q), y2: yP(q), class: "ln" }, staff);
        const gN = el("g", { class: "nt" }, staff);
        el("ellipse", { cx: x, cy: y, rx: 8.5, ry: 6, transform: `rotate(-20 ${x} ${y})` }, gN);
        const up = p < 4;
        el("rect", up ? { x: x + 7, y: y - 44, width: 1.8, height: 44 } : { x: x - 8.8, y: y, width: 1.8, height: 44 }, gN);
        nodes.push(gN);
        const li = document.createElement("li"); li.textContent = SOLM[d]; syl.appendChild(li);
      });
      keyEl.textContent = keyName(key);
    }
    function setStart(k) {
      start = Math.max(0, Math.min(9, k)); keyOut.textContent = keyName(start);
      if (!running) { draw(start); roundEl.textContent = `Lượt 1 / ${rounds()}`; }
    }
    function stop() {
      running = false; timers.forEach(clearTimeout); timers = [];
      if (bus && ctx) { bus.gain.setTargetAtTime(0, ctx.currentTime, .04); const b = bus; setTimeout(() => b.disconnect(), 400); }
      bus = null; playBtn.classList.remove("is-playing"); $(".t", playBtn).textContent = "Bắt đầu";
      nodes.forEach(n => n.classList.remove("on", "done")); $$("li", syl).forEach(l => l.classList.remove("on"));
      draw(start); roundEl.textContent = `Lượt 1 / ${rounds()}`;
    }
    function run() {
      const c = audio(); if (!c) return;
      running = true; playBtn.classList.add("is-playing"); $(".t", playBtn).textContent = "Dừng";
      bus = c.createGain(); bus.gain.value = 1; bus.connect(master);
      const vow = val("vow"), pat = PATS[val("pat")], beat = .46, n = rounds();
      let t = c.currentTime + .15;
      const at = (sec, fn) => timers.push(setTimeout(fn, Math.max(0, (sec - c.currentTime) * 1000)));
      for (let r = 0; r < n; r++) {
        const key = start + r, root = 60 + key;
        at(t, () => { draw(key); roundEl.textContent = `Lượt ${r + 1} / ${n}`; });
        [0, 4, 7].forEach(s => pluck(midiHz(root + s - 12), t, 1.1, .2, bus));
        pluck(midiHz(root), t, 1.1, .16, bus);
        t += beat * 2;
        pat.forEach((d, i) => {
          const len = i === pat.length - 1 ? beat * 1.8 : beat * .94;
          sing(midiHz(root + DEG[d]), t, len, .5, vow, bus);
          at(t, () => {
            nodes.forEach((nd, j) => { nd.classList.toggle("on", j === i); if (j < i) nd.classList.add("done"); });
            $$("li", syl).forEach((l, j) => l.classList.toggle("on", j === i));
          });
          t += i === pat.length - 1 ? beat * 2.4 : beat;
        });
      }
      at(t, stop);
    }
    playBtn.addEventListener("click", () => running ? stop() : run());
    $("#keyUp").addEventListener("click", () => setStart(start + 1));
    $("#keyDn").addEventListener("click", () => setStart(start - 1));
    $$("input[name=pat], input[name=vow]").forEach(i => i.addEventListener("change", () => { if (running) stop(); else draw(start); }));
    setStart(0);
  }

  /* ================= CRESCENDO ================= */
  $$(".dyn").forEach(b => b.addEventListener("click", () => {
    const lv = +b.dataset.vol; audio();
    b.classList.remove("ping"); void b.offsetWidth; b.classList.add("ping");
    if (soundOn) sing(midiHz(67), ctx.currentTime, 1.3, [0, .12, .26, .48, .85][lv], "a");
  }));

  /* ================= BÀI HÁT (định hướng) ================= */
  const lys = $$(".ly"), segs = $$(".sm-seg"), headEl = $(".sm-head"), songBtn = $("#songPlay");
  if (lys.length) {
    segs.forEach((s, i) => { if (/chorus/i.test(s.textContent) && !/pre/i.test(s.textContent)) s.classList.add("is-chorus"); });
    let songTimers = [], songBus = null, songOn = false;
    const NOTE = .34;
    function clearSong() {
      songTimers.forEach(clearTimeout); songTimers = [];
      if (songBus && ctx) { songBus.gain.setTargetAtTime(0, ctx.currentTime, .04); const b = songBus; setTimeout(() => b.disconnect(), 400); }
      songBus = null; songOn = false;
      lys.forEach(l => l.classList.remove("on")); segs.forEach(s => s.classList.remove("on"));
      headEl && headEl.classList.remove("on");
      songBtn && (songBtn.classList.remove("is-playing"), $(".t", songBtn).textContent = "Hát cả bài");
    }
    function phrase(li, t, bus) {
      const mel = li.dataset.mel.split(",").map(Number);
      mel.forEach((s, i) => {
        const last = i === mel.length - 1;
        sing(midiHz(60 + s), t + i * NOTE, last ? NOTE * 2 : NOTE * .95, .45, "a", bus);
      });
      pluck(midiHz(48 + (mel[0] % 12)), t, mel.length * NOTE + .4, .18, bus);
      return mel.length * NOTE + NOTE * 1.6;
    }
    function playFrom(list, whole) {
      const c = audio(); if (!c) return;
      clearSong(); songOn = true;
      songBus = c.createGain(); songBus.connect(master);
      let t = c.currentTime + .1;
      const total = list.reduce((a, li) => a + li.dataset.mel.split(",").length * NOTE + NOTE * 1.6, 0);
      let acc = 0;
      if (whole && songBtn) { songBtn.classList.add("is-playing"); $(".t", songBtn).textContent = "Dừng"; }
      list.forEach(li => {
        const k = +li.dataset.k, start = acc;
        songTimers.push(setTimeout(() => {
          lys.forEach(l => l.classList.toggle("on", l === li));
          segs.forEach((s, j) => s.classList.toggle("on", j === k));
          if (whole) {
            const r = li.getBoundingClientRect();
            if (r.top < 0 || r.bottom > innerHeight) li.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
          }
        }, (t - c.currentTime) * 1000));
        const d = phrase(li, t, songBus);
        t += d; acc += d;
      });
      if (whole && headEl) {
        headEl.classList.add("on");
        const t0 = performance.now(), map = headEl.parentElement;
        const tick = () => {
          if (!songOn) return;
          const f = Math.min(1, (performance.now() - t0) / (total * 1000));
          headEl.style.left = (f * (map.clientWidth - 2)) + "px";
          if (f < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
      songTimers.push(setTimeout(clearSong, (t - c.currentTime) * 1000 + 200));
    }
    lys.forEach(li => $(".ly-play", li).addEventListener("click", () => playFrom([li], false)));
    songBtn && songBtn.addEventListener("click", () => songOn ? clearSong() : playFrom(lys, true));
    segs.forEach((s, i) => s.addEventListener("click", () => playFrom([lys[i]], false)));
  }

  /* ================= PROGRAMME: nốt mở màn khi rê chuột ================= */
  $$(".pg").forEach(a => {
    const play = () => { if (ready()) { pluck(midiHz(60 + +a.dataset.semi), ctx.currentTime, 1.2, .22); pluck(midiHz(72 + +a.dataset.semi), ctx.currentTime + .09, 1, .1); } };
    a.addEventListener("mouseenter", play); a.addEventListener("focus", play);
  });

  /* ================= PHÍM ĐÀN (footer) ================= */
  const keys = $(".keys");
  if (keys) {
    let pressing = false;
    const hitKey = k => {
      if (!k || !k.dataset.semi) return;
      k.classList.add("on"); setTimeout(() => k.classList.remove("on"), 220);
      if (ready() || pressing) { audio(); if (soundOn) pluck(midiHz(60 + +k.dataset.semi), ctx.currentTime, 1.4, .26); }
    };
    keys.addEventListener("pointerdown", e => { pressing = true; audio(); hitKey(e.target); });
    keys.addEventListener("pointerover", e => hitKey(e.target));
    keys.addEventListener("pointermove", e => {
      if (e.pointerType !== "mouse" && pressing) {
        const k = document.elementFromPoint(e.clientX, e.clientY);
        if (k && k !== keys._last) { keys._last = k; hitKey(k); }
      }
    });
    addEventListener("pointerup", () => { pressing = false; keys._last = null; });
  }

  /* ================= LIGHTBOX ảnh chụp màn hình ================= */
  const lb = $("#lb");
  if (lb) {
    document.body.appendChild(lb);
    const shots = $$(".shot"), img = $("img", lb), cap = $("figcaption", lb);
    let idx = 0, lastFocus = null;
    const show = i => {
      idx = (i + shots.length) % shots.length;
      img.src = shots[idx].dataset.full; img.alt = shots[idx].dataset.cap; cap.textContent = shots[idx].dataset.cap;
    };
    const open = i => { lastFocus = document.activeElement; show(i); lb.hidden = false; document.body.style.overflow = "hidden"; $(".lb-x", lb).focus(); };
    const close = () => { lb.hidden = true; document.body.style.overflow = ""; lastFocus && lastFocus.focus(); };
    shots.forEach((b, i) => b.addEventListener("click", () => open(i)));
    $(".lb-x", lb).addEventListener("click", close);
    $(".lb-prev", lb).addEventListener("click", () => show(idx - 1));
    $(".lb-next", lb).addEventListener("click", () => show(idx + 1));
    lb.addEventListener("click", e => { if (e.target === lb) close(); });
    addEventListener("keydown", e => {
      if (lb.hidden) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(idx - 1);
      if (e.key === "ArrowRight") show(idx + 1);
    });
  }

  /* ================= GAM NGUYÊN TẮC: bấm nốt để nghe gam đi lên ================= */
  const sols = $$(".sol");
  sols.forEach(b => b.addEventListener("click", () => {
    const c = audio(); if (!c || !soundOn) return;
    const deg = +b.dataset.deg;
    for (let i = 0; i <= deg; i++) {
      const t = c.currentTime + i * .28, last = i === deg;
      sing(midiHz(60 + MAJ[i]), t, last ? .9 : .3, last ? .5 : .32, "a");
      setTimeout(() => { sols.forEach(s => s.classList.toggle("on", s === sols[i])); }, i * 280);
    }
    setTimeout(() => sols.forEach(s => s.classList.remove("on")), deg * 280 + 900);
  }));

  /* ================= VÉ: nghiêng theo chuột ================= */
  const tk = $("#ticket");
  if (tk && !reduce && matchMedia("(hover:hover)").matches) {
    tk.addEventListener("pointermove", e => {
      const r = tk.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      tk.style.transform = `perspective(1200px) rotateY(${x * 5}deg) rotateX(${-y * 5}deg)`;
    });
    tk.addEventListener("pointerleave", () => { tk.style.transform = ""; });
  }

  /* ================= BÀI 5: HỌC LIỆU "KHỞI ĐỘNG GIỌNG" ================= */
  /** Tiếng thở "sss": nhiễu trắng qua lọc thông cao. */
  function hiss(t0, dur, vol = .18) {
    const c = audio(); if (!c) return;
    const t = Math.max(t0, c.currentTime), n = Math.ceil(c.sampleRate * dur);
    const buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(); src.buffer = buf;
    const hp = c.createBiquadFilter(); hp.type = "bandpass"; hp.frequency.value = 6500; hp.Q.value = .8;
    const g = c.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .3);
    g.gain.setValueAtTime(vol, t + dur - .6); g.gain.linearRampToValueAtTime(0, t + dur);
    src.connect(hp).connect(g).connect(master); src.start(t); src.stop(t + dur + .05);
  }
  const games = $$(".game");
  let busy = null;
  const later = (fn, ms) => setTimeout(fn, ms);
  function demo(card) {
    const c = audio(); if (!c) return 0;
    if (!soundOn) { soundOn = true; store.set("ma-sound", "on"); paintSnd(); master.gain.setTargetAtTime(.9, c.currentTime, .05); }
    const t = c.currentTime + .05, kind = card.dataset.demo;
    card.classList.add("on");
    if (kind === "breath") {
      // hít vào 4 giây (im lặng, bóng phồng) rồi thở ra "sss" 6 giây
      later(() => { card.classList.add("out"); }, 4000);
      hiss(t + 4, 6, .2);
      return 10200;
    }
    if (kind === "hum") {
      const vis = $$(".g-vis-hum i", card);
      [0, 2, 4, 5, 7].forEach((s, i) => {
        sing(midiHz(60 + s), t + i * .9, .85, .34, "u");
        later(() => vis.forEach((v, k) => v.classList.toggle("lit", k === i)), i * 900);
      });
      return 4700;
    }
    if (kind === "glide") {
      const dot = $(".g-vis-glide circle", card), path = $(".g-vis-glide path", card);
      const C4 = midiHz(60), G4 = midiHz(67), C5 = midiHz(72);
      sing(C4, t, 2.4, .36, "u", null, [[.2, C4], [1.2, G4], [2.2, C4]]);
      sing(C4, t + 2.8, 3, .36, "u", null, [[.2, C4], [1.5, C5], [2.8, C4]]);
      if (dot && path && path.getTotalLength) {
        const L = path.getTotalLength(), t0 = performance.now();
        const step = now => {
          const k = Math.min(1, (now - t0) / 5800), p = path.getPointAtLength(L * k);
          dot.setAttribute("cx", p.x); dot.setAttribute("cy", p.y);
          if (k < 1 && card.classList.contains("on")) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
      return 6000;
    }
    if (kind === "diction") return chantAll(card, t);
    return 0;
  }
  // Đọc 1 dòng theo nhịp Fa – Son: mỗi chữ một nốt ngắn, chữ cuối ngân dài
  function chant(text, t, el) {
    const words = text.split(" "), F = midiHz(65), G = midiHz(67), beat = .32;
    words.forEach((w, i) => {
      const last = i === words.length - 1;
      sing(i % 2 ? G : F, t + i * beat, last ? .55 : .2, .38, /[iíìỉĩị]/i.test(w) ? "i" : /[uúùủũụưô]/i.test(w) ? "u" : "a");
      pluck(i % 2 ? G : F, t + i * beat, .25, .08);
    });
    if (el) { el.classList.add("on"); later(() => el.classList.remove("on"), (words.length * beat + .5) * 1000); }
    return words.length * beat + .7;
  }
  function chantAll(card, t) {
    let at = 0;
    $$(".say", card).forEach(b => { const d0 = at; later(() => chant(b.dataset.say, ctx.currentTime + .02, b), d0 * 1000); at += b.dataset.say.split(" ").length * .32 + .7; });
    return at * 1000 + 200;
  }
  games.forEach(card => {
    const btn = $(".g-btn", card);
    btn && btn.addEventListener("click", () => {
      if (busy) return;
      games.forEach(g => g.classList.remove("on", "out"));
      busy = card; btn.classList.add("is-playing");
      const ms = demo(card);
      later(() => { card.classList.remove("on", "out"); btn.classList.remove("is-playing"); busy = null; }, ms);
    });
    $$(".say", card).forEach(b => b.addEventListener("click", e => {
      e.stopPropagation(); const c = audio(); if (!c || !soundOn) return;
      chant(b.dataset.say, c.currentTime + .03, b);
    }));
  });
  // Câu vè: đọc theo nhịp 2/4, vỗ tay ở phách mạnh
  const veBtn = $(".ve-btn");
  veBtn && veBtn.addEventListener("click", () => {
    const c = audio(); if (!c || veBtn.classList.contains("is-playing")) return;
    if (!soundOn) { soundOn = true; store.set("ma-sound", "on"); paintSnd(); master.gain.setTargetAtTime(.9, c.currentTime, .05); }
    veBtn.classList.add("is-playing");
    const spans = $$(".ve-lines span"), beat = .42, t = c.currentTime + .1;
    const mel = [67, 67, 64, 60, 69, 67, 64, 62, 64, 65, 67, 69, 72, 67, 64, 60];
    spans.forEach((s, i) => {
      const end = (i + 1) % 4 === 0;
      sing(midiHz(mel[i % mel.length]), t + i * beat, end ? .38 : .26, .3, "a");
      if (i % 2 === 0) pluck(midiHz(48), t + i * beat, .2, .14);
      later(() => { spans.forEach(x => x.classList.remove("on")); s.classList.add("on"); }, (i * beat + .1) * 1000);
    });
    later(() => { spans.forEach(x => x.classList.remove("on")); veBtn.classList.remove("is-playing"); }, (spans.length * beat + .6) * 1000);
  });

  /* ================= BÀI 6: BẢNG TỰ KIỂM TRA ================= */
  const chk = $("#chkList");
  if (chk) {
    const boxes = $$("input", chk), out = $(".chk-out", chk);
    boxes.forEach(b => b.addEventListener("change", () => {
      const n = boxes.filter(x => x.checked).length, done = n === boxes.length;
      $("b", out).textContent = n;
      $("span", out).textContent = done ? "Sẵn sàng nộp bài" : "Chưa sẵn sàng nộp";
      out.classList.toggle("done", done);
      if (ready()) {
        const t = ctx.currentTime;
        if (done) [60, 64, 67, 72].forEach((m, i) => sing(midiHz(m), t + i * .16, i === 3 ? .9 : .2, .34, "a"));
        else if (b.checked) pluck(midiHz(60 + MAJ[Math.min(n, 7) - 1]), t, .8, .2);
      }
    }));
  }
})();
