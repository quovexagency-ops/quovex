/* Hire Us page 3D, kept calm on purpose (one thing moving at a time):
   1. Dot globe beside the FAQ: a sphere of fine dots, like the site's
      stars, turning slowly, with a red dot orbiting it.
   2. Package cards: dealt out of one stack into their places, once.
   3. FAQ and the quote form swing up from a slight tilt into place as
      they scroll in (same motion as the Portfolio page).
   4. Paper plane: flies off the Send button when a quote is sent.
   Nothing follows the cursor. Reduced motion: still globe, no tilts. */
(function(){
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('has-3d');

  /* ---------- 1. dot globe ---------- */
  var globe = document.getElementById('faqGlobe');
  if(globe){
    var g = globe.getContext('2d');
    var N = 720, pts = [], size = 0, DPR = 1;
    var golden = Math.PI * (3 - Math.sqrt(5));
    for(var i = 0; i < N; i++){
      var y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = golden * i;
      // about one in ten dots red, one in ten navy, like the star palette
      var c = i % 10 === 3 ? '174,31,35' : i % 10 === 7 ? '0,48,73' : '36,31,29';
      pts.push([Math.cos(th) * r, y, Math.sin(th) * r, c]);
    }
    function fit(){
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      size = globe.clientWidth;
      globe.width = Math.round(size * DPR); globe.height = Math.round(size * DPR);
      g.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    fit();
    window.addEventListener('resize', fit);

    var TILT = 0.38, ct = Math.cos(TILT), st = Math.sin(TILT);
    function draw(t){
      var R = size * 0.36, cx = size / 2, cy = size / 2;
      g.clearRect(0, 0, size, size);
      var a = t * 0.00016, ca = Math.cos(a), sa = Math.sin(a);
      // faint back half of the orbit ring first, then the sphere, then the front half
      var orb = t * 0.00045;
      function ring(front){
        g.beginPath();
        for(var k = 0; k <= 64; k++){
          var u = k / 64 * Math.PI * 2;
          var x = Math.cos(u) * 1.32, z = Math.sin(u) * 1.32, yy = 0;
          var y2 = yy * Math.cos(0.9) - z * Math.sin(0.9), z2 = yy * Math.sin(0.9) + z * Math.cos(0.9);
          if((z2 > 0) !== front){ g.moveTo(cx + x * R, cy + y2 * R); continue; }
          g.lineTo(cx + x * R, cy + y2 * R);
        }
        g.strokeStyle = front ? 'rgba(120,0,0,.32)' : 'rgba(120,0,0,.12)';
        g.lineWidth = 1;
        g.stroke();
      }
      function satellite(front){
        var x = Math.cos(orb) * 1.32, z = Math.sin(orb) * 1.32;
        var y2 = -z * Math.sin(0.9), z2 = z * Math.cos(0.9);
        if((z2 > 0) !== front) return;
        var px = cx + x * R, py = cy + y2 * R;
        g.fillStyle = 'rgba(174,31,35,.18)';
        g.beginPath(); g.arc(px, py, 9, 0, 6.2832); g.fill();
        g.fillStyle = '#AE1F23';
        g.beginPath(); g.arc(px, py, 4, 0, 6.2832); g.fill();
      }
      ring(false); satellite(false);
      for(var i = 0; i < N; i++){
        var p = pts[i];
        var x = p[0] * ca + p[2] * sa, z = -p[0] * sa + p[2] * ca, y = p[1];
        var y2 = y * ct - z * st, z2 = y * st + z * ct;
        var front = (z2 + 1) / 2;            // 0 back, 1 front
        var alpha = 0.08 + front * front * 0.82;
        var rad = 0.7 + front * 1.15;
        g.fillStyle = 'rgba(' + p[3] + ',' + alpha.toFixed(3) + ')';
        g.beginPath(); g.arc(cx + x * R, cy + y2 * R, rad, 0, 6.2832); g.fill();
      }
      ring(true); satellite(true);
    }

    if(reduce){ draw(9000); window.addEventListener('resize', function(){ draw(9000); }); }
    else {
      var visible = false, raf = null;
      function loop(t){ draw(t); raf = visible ? requestAnimationFrame(loop) : null; }
      new IntersectionObserver(function(es){
        visible = es[0].isIntersecting;
        if(visible && !raf) raf = requestAnimationFrame(loop);
      }).observe(globe);
      draw(0);
    }
  }

  /* ---------- 2. package cards dealt out once ---------- */
  var list = document.querySelector('.packages-list');
  if(list){
    if(reduce || !('IntersectionObserver' in window)) list.classList.add('is-dealt');
    else new IntersectionObserver(function(es, ob){
      if(es[0].isIntersecting){ list.classList.add('is-dealt'); ob.disconnect(); }
    }, {threshold: 0.3}).observe(list);
  }

  /* ---------- 3. swing into place on scroll ---------- */
  var swings = Array.prototype.slice.call(document.querySelectorAll('[data-swing]'));
  function clamp(v){ return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ease(t){ return 1 - Math.pow(1 - t, 3); }
  if(reduce){ swings.forEach(function(el){ el.style.setProperty('--in', '1'); }); }
  else if(swings.length){
    var ticking = false;
    function update(){
      ticking = false;
      var vh = window.innerHeight;
      for(var i = 0; i < swings.length; i++){
        var r = swings[i].getBoundingClientRect();
        swings[i].style.setProperty('--in', ease(clamp((vh - r.top) / (vh * 0.42))).toFixed(4));
      }
    }
    function req(){ if(!ticking){ ticking = true; requestAnimationFrame(update); } }
    window.addEventListener('scroll', req, {passive: true});
    window.addEventListener('resize', req);
    update();
  }

  /* ---------- 4. paper plane off the Send button ---------- */
  var form = document.getElementById('quoteForm');
  if(form){
    form.addEventListener('quote:sent', function(){
      if(reduce) return;
      var btn = form.querySelector('button[type="submit"]');
      var host = form.querySelector('.quote-actions');
      if(!btn || !host) return;
      var plane = document.createElement('span');
      plane.className = 'paper-plane';
      plane.setAttribute('aria-hidden', 'true');
      plane.innerHTML = '<svg viewBox="0 0 48 48" width="46" height="46"><path d="M4 22 44 5 34 43 23 29Z" fill="#AE1F23"/><path d="M23 29 44 5 16 25Z" fill="#780000"/><path d="M23 29 21 39 27 33Z" fill="#5a0000"/></svg>';
      plane.style.left = (btn.offsetLeft + btn.offsetWidth - 30) + 'px';
      plane.style.top = (btn.offsetTop - 8) + 'px';
      host.appendChild(plane);
      setTimeout(function(){ plane.remove(); }, 2200);
    });
  }
})();
