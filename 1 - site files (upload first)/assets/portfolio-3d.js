/* Portfolio page 3D: three effects that share one motion language
   (tilted back in space, settling flat) and one scroll loop.

   1. Warp star field: the hero's stars become a real 3D field on a
      fixed canvas behind the whole page. They drift toward you slowly
      on their own, stream toward you while you scroll down (away while
      you scroll up) and stretch into streaks when you scroll fast.
   2. iPad: rises out of a 3D tilt and settles flat on load (CSS), a
      sweep of light crosses the glass as it lands, and it tilts gently
      back as you scroll away from it.
   3. Sections: each carousel swings up from the same tilt into place
      as it scrolls into view, and back out the same way.

   Nothing follows the cursor; everything is driven by time or scroll.
   With reduced motion: still stars, no tilts. */
(function(){
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;
  root.classList.add('has-3d');

  /* ---------- 1. warp star field ---------- */
  var canvas = document.createElement('canvas');
  canvas.className = 'warp-field';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.insertBefore(canvas, document.body.firstChild);
  var ctx = canvas.getContext('2d');
  var W = 0, H = 0, DPR = 1, stars = [], unit = 1;
  // same palette as the old hero stars: mostly ink-black, a few red and navy
  var COLORS = ['36,31,29', '36,31,29', '36,31,29', '36,31,29', '36,31,29', '36,31,29', '36,31,29', '174,31,35', '0,48,73'];

  var seed = 0x51A7;
  function rand(){
    seed = (seed + 0x6D2B79F5) | 0;
    var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function makeStar(s, z){
    s.x = (rand() * 2 - 1) * W * 0.7;
    s.y = (rand() * 2 - 1) * H * 0.7;
    s.z = z == null ? 0.15 + rand() * 0.85 : z;
    s.size = rand() < 0.06 ? 2.6 : rand() < 0.25 ? 1.8 : 1.15;
    s.c = COLORS[(rand() * COLORS.length) | 0];
    s.tw = rand() * Math.PI * 2;
    s.tws = 0.8 + rand() * 1.8;
    return s;
  }
  function resize(){
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    unit = Math.max(1, Math.min(2.2, W / 900));
    var want = W < 700 ? 170 : 330;
    seed = 0x51A7; stars = [];
    for(var i = 0; i < want; i++) stars.push(makeStar({}));
  }
  resize();
  window.addEventListener('resize', resize);

  // scroll speed (px per second), smoothed so the warp eases in and out
  var lastY = window.scrollY, lastT = performance.now(), vel = 0, velSm = 0;
  var IDLE = 0.018; // depth units per second when nobody scrolls

  function drawStars(dt, now){
    ctx.clearRect(0, 0, W, H);
    var cx = W / 2, cy = H * 0.42;
    var speed = IDLE + Math.min(2.4, Math.abs(velSm) * 0.0011);
    var dir = velSm < -20 ? -1 : 1;
    var dz = reduce ? 0 : speed * dir * dt;
    // the further down the page, the quieter the field (keeps videos clean)
    var fade = Math.max(0.38, 1 - window.scrollY / (H * 1.6));
    var streak = Math.min(0.12, Math.abs(dz) * 3.2);
    for(var i = 0; i < stars.length; i++){
      var s = stars[i];
      s.z -= dz;
      if(s.z < 0.06){ makeStar(s, 1); }
      else if(s.z > 1){ makeStar(s, 0.07 + rand() * 0.1); }
      var px = cx + s.x / s.z * 0.55, py = cy + s.y / s.z * 0.55;
      if(px < -20 || px > W + 20 || py < -20 || py > H + 20){
        if(dir > 0) makeStar(s, 1); else makeStar(s, 0.15 + rand() * 0.3);
        continue;
      }
      var near = 1 - s.z;
      var r = s.size * unit * (0.45 + near * 1.1);
      var a = (0.35 + near * 0.65) * (0.72 + 0.28 * Math.sin(s.tw + now * 0.001 * s.tws)) * fade;
      ctx.fillStyle = ctx.strokeStyle = 'rgba(' + s.c + ',' + a.toFixed(3) + ')';
      if(streak > 0.012){
        // a streak back toward where the star just was
        var tz = s.z + streak * dir;
        var qx = cx + s.x / tz * 0.55, qy = cy + s.y / tz * 0.55;
        ctx.lineWidth = r * 1.6;
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(qx, qy); ctx.lineTo(px, py); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.arc(px, py, r, 0, 6.2832); ctx.fill();
      }
    }
  }

  /* ---------- 2 + 3. scroll-driven tilts ---------- */
  var device = document.getElementById('heroDevice');
  var hero = document.getElementById('portfolioHero');
  var swings = Array.prototype.slice.call(document.querySelectorAll('[data-swing]'));

  function clamp(v){ return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ease(t){ return 1 - Math.pow(1 - t, 3); }

  function updateTilts(){
    var vh = window.innerHeight;
    if(device && hero){
      // 0 while the iPad is fully in view, 1 once the hero has scrolled away
      var p = clamp(window.scrollY / (hero.offsetHeight * 0.85));
      device.style.setProperty('--away', p.toFixed(4));
    }
    for(var i = 0; i < swings.length; i++){
      var el = swings[i], r = el.getBoundingClientRect();
      // 0 when its top is at the bottom of the screen, 1 once it has risen a third of the way up
      var q = ease(clamp((vh - r.top) / (vh * 0.42)));
      el.style.setProperty('--in', q.toFixed(4));
    }
  }

  var running = true;
  function frame(now){
    if(!running) return;
    var dt = Math.min(0.05, (now - lastT) / 1000) || 0.016;
    var y = window.scrollY;
    vel = (y - lastY) / dt;
    lastY = y; lastT = now;
    velSm += (vel - velSm) * Math.min(1, dt * 6);
    if(Math.abs(velSm) < 1) velSm = 0;
    drawStars(dt, now);
    if(!reduce) updateTilts();
    requestAnimationFrame(frame);
  }
  if(reduce){
    drawStars(0, 0);
    window.addEventListener('resize', function(){ drawStars(0, 0); });
    swings.forEach(function(el){ el.style.setProperty('--in', '1'); });
  } else {
    requestAnimationFrame(frame);
    document.addEventListener('visibilitychange', function(){
      running = !document.hidden;
      if(running){ lastT = performance.now(); lastY = window.scrollY; requestAnimationFrame(frame); }
    });
  }

  /* the light sweep across the glass, once the iPad has landed */
  var frameEl = document.getElementById('heroDeviceFrame');
  if(frameEl && !reduce){
    frameEl.addEventListener('animationend', function(e){
      if(e.animationName === 'deviceLand') frameEl.classList.add('is-landed');
    });
  }
})();
