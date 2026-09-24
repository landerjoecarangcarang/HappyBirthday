/* ===== Happy Birthday — interactivity ===== */
(function () {
  'use strict';

  const canvas = document.getElementById('fx');
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  /* ---------- Particle system ---------- */
  const COLORS = ['#ffd166', '#ff5da2', '#b388ff', '#ff6f3c', '#fff5f7', '#7c4dff'];
  let particles = [];
  let fireworks = [];

  function rand(a, b) { return a + Math.random() * (b - a); }

  function burst(x, y, count, opts) {
    opts = opts || {};
    const power = opts.power || 1;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = rand(2, 7) * power;
      particles.push({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - (opts.up || 0),
        life: rand(60, 120),
        age: 0,
        size: rand(3, 7),
        color: COLORS[(Math.random() * COLORS.length) | 0],
        shape: Math.random() < 0.3 ? 'rect' : 'circ',
        rot: Math.random() * Math.PI,
        vr: rand(-0.2, 0.2),
        grav: opts.grav == null ? 0.12 : opts.grav
      });
    }
  }

  function spawnFirework(x, y) {
    burst(x, y, 60, { power: 1.6, grav: 0.06 });
  }

  function tick() {
    ctx.clearRect(0, 0, W, H);

    // confetti
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.age++;
      p.vy += p.grav;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      const t = 1 - p.age / p.life;
      if (t <= 0 || p.y > H + 40) { particles.splice(i, 1); continue; }
      ctx.globalAlpha = Math.max(0, t);
      ctx.fillStyle = p.color;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      if (p.shape === 'rect') {
        ctx.fillRect(-p.size, -p.size * 0.4, p.size * 2, p.size * 0.8);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // fireworks rise + explode
    for (let i = fireworks.length - 1; i >= 0; i--) {
      const f = fireworks[i];
      f.vy += 0.05;
      f.x += f.vx;
      f.y += f.vy;
      ctx.globalAlpha = 1;
      ctx.fillStyle = f.color;
      ctx.beginPath();
      ctx.arc(f.x, f.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
      if (f.vy >= -1 || f.y < f.targetY) {
        spawnFirework(f.x, f.y);
        fireworks.splice(i, 1);
      }
    }

    ctx.globalAlpha = 1;
    requestAnimationFrame(tick);
  }
  tick();

  /* ---------- Fireworks launcher ---------- */
  function launchFirework() {
    const x = rand(W * 0.2, W * 0.8);
    const y = H + 10;
    const targetY = rand(H * 0.15, H * 0.4);
    fireworks.push({
      x, y, vx: rand(-0.6, 0.6), vy: -Math.sqrt(2 * 0.05 * (y - targetY)) - 0.5,
      targetY, color: COLORS[(Math.random() * COLORS.length) | 0]
    });
  }

  /* ---------- Cake / candles ---------- */
  const cake = document.getElementById('cake');
  const candles = Array.from(document.querySelectorAll('.candle'));
  const cakeHint = document.getElementById('cakeHint');
  const greeting = document.getElementById('greeting');
  const nameInput = document.getElementById('nameInput');

  function litCount() { return candles.filter(c => !c.classList.contains('out')).length; }

  candles.forEach(c => {
    c.addEventListener('click', (e) => { e.stopPropagation(); blowCandle(c); });
    c.addEventListener('touchstart', (e) => { e.stopPropagation(); blowCandle(c); }, { passive: true });
  });

  function blowCandle(c) {
    if (c.classList.contains('out')) return;
    c.classList.add('out');
    // small puff confetti
    const r = c.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top - 10, 14, { power: 0.6, up: 1, grav: 0.18 });
    const left = litCount();
    if (left === 0) {
      cakeHint.textContent = '🎉 Wishes granted! Look up…';
      celebrate();
    } else {
      cakeHint.textContent = left + ' candle' + (left > 1 ? 's' : '') + ' left — keep going!';
    }
  }

  function relightCandles() {
    candles.forEach(c => c.classList.remove('out'));
    cakeHint.textContent = 'Tap the candles to blow them out! 💨';
  }

  /* ---------- Celebrate ---------- */
  const celebrateBtn = document.getElementById('celebrateBtn');
  celebrateBtn.addEventListener('click', celebrate);

  function celebrate() {
    // confetti shower from top
    for (let i = 0; i < 6; i++) {
      setTimeout(() => burst(rand(0, W), -10, 40, { power: 1, grav: 0.14 }), i * 120);
    }
    // fireworks
    let n = 0;
    const fwInterval = setInterval(() => {
      launchFirework();
      n++;
      if (n >= 5) clearInterval(fwInterval);
    }, 350);

    if (litCount() === 0) showWish();
  }

  /* ---------- Wish overlay ---------- */
  let wishEl = null;
  function showWish() {
    if (wishEl && wishEl.classList.contains('show')) return;
    const name = (nameInput.value || '').trim();
    const who = name ? name : 'you';
    if (!wishEl) {
      wishEl = document.createElement('div');
      wishEl.className = 'wish';
      wishEl.innerHTML =
        '<div class="wish-card">' +
        '<h2>Happy Birthday!</h2>' +
        '<p id="wishText"></p>' +
        '<button class="again">Celebrate again 🎉</button>' +
        '</div>';
      document.body.appendChild(wishEl);
      wishEl.querySelector('.again').addEventListener('click', () => {
        wishEl.classList.remove('show');
        relightCandles();
      });
    }
    document.getElementById('wishText').textContent =
      'My dear cousin ' + who + ', may your year be filled with laughter, love, and may your every wish come true. 🎂✨';
    wishEl.classList.add('show');
  }

  /* ---------- Name greeting ---------- */
  nameInput.addEventListener('input', () => {
    const n = nameInput.value.trim();
    greeting.textContent = n
      ? 'Happy Birthday, ' + n + '! 🎂 Make a wish!'
      : 'Today is all about you. Make a wish! 🎂';
  });

  /* ---------- Tap anywhere for confetti ---------- */
  document.addEventListener('click', (e) => {
    if (e.target.closest('.btn, .candle, .name-field, .wish, .cake')) return;
    burst(e.clientX, e.clientY, 24, { power: 1, grav: 0.12 });
  });

  /* ---------- Music (Web Audio, no file needed) ---------- */
  const soundBtn = document.getElementById('soundBtn');
  let audioCtx = null, musicTimer = null, playing = false;

  // "Happy Birthday" melody (simplified), frequencies in Hz
  const MELODY = [
    [262, .4], [262, .2], [294, .6], [262, .6], [349, .6], [330, 1.2],
    [262, .4], [262, .2], [294, .6], [262, .6], [392, .6], [349, 1.2],
    [262, .4], [262, .2], [523, .6], [440, .6], [349, .6], [330, .6], [294, .9], [466, .4], [440, .6],
    [466, .4], [440, .6], [349, .6], [392, .6], [349, 1.2]
  ];

  function playNote(freq, dur, startAt) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, startAt);
    gain.gain.linearRampToValueAtTime(0.18, startAt + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, startAt + dur);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(startAt);
    osc.stop(startAt + dur + 0.05);
  }

  function playLoop() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    let t = audioCtx.currentTime + 0.05;
    MELODY.forEach(([f, d]) => { playNote(f, d, t); t += d; });
    musicTimer = setTimeout(playLoop, (t - audioCtx.currentTime) * 1000);
  }

  soundBtn.addEventListener('click', () => {
    playing = !playing;
    soundBtn.setAttribute('aria-pressed', String(playing));
    soundBtn.textContent = playing ? '⏸ Music' : '🔊 Music';
    if (playing) {
      playLoop();
    } else {
      clearTimeout(musicTimer);
      musicTimer = null;
    }
  });

  // initial gentle confetti
  setTimeout(() => burst(W / 2, H * 0.35, 50, { power: 1.1, grav: 0.1 }), 400);
})();
