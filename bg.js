/* Animated project-network background for clufy.github.io. Usage:
   <script src="https://clufy.github.io/bg.js" data-accent="#3fb950" defer></script>
   No data-accent = multi-colour (one colour per project). */
(() => {
  const me = document.currentScript;
  const accent = me && me.dataset.accent;
  const PALETTE = accent ? [accent, accent, accent, '#8b949e'] : ['#a371f7', '#58a6ff', '#3fb950', '#f78166', '#dbab09', '#39c5cf'];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(pointer: fine)').matches;

  const cv = document.createElement('canvas');
  cv.setAttribute('aria-hidden', 'true');
  cv.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:-1;pointer-events:none;display:block';
  document.body.prepend(cv);
  const x = cv.getContext('2d');

  let W = 0, H = 0, dpr = 1, nodes = [], pulses = [], mouse = { x: -1e4, y: -1e4, on: false }, scrollY0 = window.scrollY;
  const LINK = 150;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const hex = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0);
    const target = Math.max(28, Math.min(95, Math.round(W * H / 15000)));
    while (nodes.length < target) nodes.push({ x: rnd(0, W), y: rnd(0, H), vx: rnd(-.18, .18), vy: rnd(-.18, .18), r: rnd(1.4, 3.2), c: PALETTE[nodes.length % PALETTE.length], ph: rnd(0, 6.28) });
    nodes.length = target;
  }

  let raf = 0;
  const go = () => { if (!raf) raf = requestAnimationFrame(step); };
  function step(t) {
    raf = 0;
    const sy = window.scrollY, dy = (sy - scrollY0) * 0.25; scrollY0 = sy;
    x.clearRect(0, 0, W, H);
    for (const n of nodes) {
      if (!reduce) {
        n.x += n.vx; n.y += n.vy - dy;
        if (mouse.on) { // gentle pull toward the cursor
          const ddx = mouse.x - n.x, ddy = mouse.y - n.y, d2 = ddx * ddx + ddy * ddy;
          if (d2 < 200 * 200 && d2 > 400) { const f = 0.012 * (1 - Math.sqrt(d2) / 200); n.x += ddx * f; n.y += ddy * f; }
        }
        if (n.x < -20) n.x = W + 20; else if (n.x > W + 20) n.x = -20;
        if (n.y < -20) n.y = H + 20; else if (n.y > H + 20) n.y = -20;
      }
    }
    // links
    x.lineWidth = 1;
    const links = [];
    for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j], dx = a.x - b.x, dy2 = a.y - b.y, d = Math.hypot(dx, dy2);
      if (d < LINK) { const al = (1 - d / LINK) * 0.22; x.strokeStyle = hex(a.c, al); x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.stroke(); links.push([a, b]); }
    }
    // cursor links
    if (mouse.on) for (const n of nodes) {
      const d = Math.hypot(n.x - mouse.x, n.y - mouse.y);
      if (d < 180) { x.strokeStyle = hex(n.c, (1 - d / 180) * 0.45); x.beginPath(); x.moveTo(mouse.x, mouse.y); x.lineTo(n.x, n.y); x.stroke(); }
    }
    // pulses travelling along links ("traffic")
    if (!reduce && links.length && pulses.length < 14 && Math.random() < 0.08) { const [a, b] = links[(Math.random() * links.length) | 0]; pulses.push({ a, b, u: 0, sp: rnd(0.012, 0.03) }); }
    pulses = pulses.filter(p => (p.u += p.sp) < 1 && Math.hypot(p.a.x - p.b.x, p.a.y - p.b.y) < LINK * 1.2);
    for (const p of pulses) {
      const px = p.a.x + (p.b.x - p.a.x) * p.u, py = p.a.y + (p.b.y - p.a.y) * p.u;
      x.fillStyle = hex(p.a.c, 0.9); x.beginPath(); x.arc(px, py, 2.2, 0, 7); x.fill();
      x.fillStyle = hex(p.a.c, 0.18); x.beginPath(); x.arc(px, py, 6, 0, 7); x.fill();
    }
    // nodes
    for (const n of nodes) {
      const tw = reduce ? 1 : 0.75 + 0.25 * Math.sin(t / 900 + n.ph);
      x.fillStyle = hex(n.c, 0.55 * tw); x.beginPath(); x.arc(n.x, n.y, n.r, 0, 7); x.fill();
    }
    if (!reduce && !document.hidden) go();
  }

  resize();
  window.addEventListener('resize', () => { resize(); if (reduce) step(0); }, { passive: true });
  if (fine) {
    window.addEventListener('pointermove', e => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.on = true; }, { passive: true });
    window.addEventListener('mouseout', e => { if (!e.relatedTarget) mouse.on = false; });
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !reduce) go(); });
  go();
})();
