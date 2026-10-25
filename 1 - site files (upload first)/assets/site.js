/* ---------- QUOVEX contact details: the ONE place to fill these in ----------
   Every "Start a project" button, email button, WhatsApp button and
   social link on every page reads from here.
   - booking:   a scheduling link (e.g. Calendly). Left empty, those
                buttons open the quote form on the Hire Us page instead.
   - email:     left empty, every "email us" button stays hidden.
   - whatsapp:  number with country code, digits only (e.g. 923001234567).
                Left empty, WhatsApp buttons stay hidden.
   - instagram / linkedin: full profile URLs. Left empty, they stay hidden. */
// where the concrete texture lives, worked out from this script's own URL
// so it resolves correctly from any page
var QUOVEX_TEXTURE_URL = (function(){
  try { return new URL('concrete.webp', document.currentScript.src).href; }
  catch(e){ return 'assets/concrete.webp'; }
})();

var QUOVEX_CONTACT = {
  booking: '',
  email: '',
  whatsapp: '',
  instagram: 'https://www.instagram.com/quovex.agency/',
  linkedin: 'https://www.linkedin.com/in/jazzyali/'
};

(function(){
  function ready(fn){
    if(document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', fn); }
    else { fn(); }
  }

  ready(function(){

    /* ---------- contact links, driven by QUOVEX_CONTACT above ---------- */
    var c = QUOVEX_CONTACT;
    var contactHref = {
      booking: c.booking,
      email: c.email ? 'mailto:' + c.email : '',
      whatsapp: c.whatsapp ? 'https://wa.me/' + String(c.whatsapp).replace(/\D/g, '') : '',
      instagram: c.instagram,
      linkedin: c.linkedin
    };
    document.querySelectorAll('[data-contact]').forEach(function(el){
      var href = contactHref[el.getAttribute('data-contact')];
      if(href){
        el.setAttribute('href', href);
        if(!/^mailto:/.test(href)){ el.setAttribute('target', '_blank'); el.setAttribute('rel', 'noopener'); }
        el.hidden = false;
      } else if(el.classList.contains('social-icon')){
        // the Instagram / WhatsApp pills always show; until their link is
        // filled in above they're shown but don't go anywhere yet
        el.removeAttribute('href');
        el.setAttribute('aria-disabled', 'true');
        el.classList.add('is-pending');
        el.hidden = false;
      } else if(el.getAttribute('data-contact') !== 'booking'){
        // booking keeps its built-in fallback (the quote form); everything
        // else simply stays out of sight until it has somewhere to go
        el.hidden = true;
      }
    });

    /* ---------- hero starlight fields ----------
       Exactly STAR_COUNT stars in every .hero-star-field, on every screen
       size, scattered irregularly like the hand-placed fibre-optic points
       of a Rolls-Royce Starlight Headliner. Density is uneven like the
       real thing: a soft diagonal band (a Milky Way) and a few denser
       clusters over a sparser background, with a handful of brighter
       points among many fine ones.
       - Positions come from a fixed-seed generator, so every visitor sees
         the same sky. Each star is drawn from the density map, then picked
         by best-candidate sampling (the try that lands farthest from the
         stars already placed), which avoids clumps and bald patches while
         staying organic.
       - A soft clear zone is left behind the page title.
       - Positions are percentages of the hero, so the same stars land in
         the same relative spots at any width; sizes scale with the screen
         via the --s unit in site.css. */
    document.querySelectorAll('.hero-star-field').forEach(function(field){
      var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var STAR_COUNT = 377;
      var CANDIDATES = 3;   // higher = more even, lower = more irregular

      // mulberry32: tiny seeded PRNG, so the "random" sky is identical every load
      var seed = 0x51A7;
      function rand(){
        seed = (seed + 0x6D2B79F5) | 0;
        var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      }

      // density map (coords 0..1): a sparse floor, a diagonal band running
      // from lower left to upper right, and three tighter clusters
      var CLUSTERS = [[0.18, 0.22, 0.07], [0.8, 0.3, 0.06], [0.68, 0.82, 0.08]];
      function density(x, y){
        var band = (x + y - 1.05) / Math.SQRT2;
        var d = 0.3 + 0.7 * Math.exp(-band * band / (2 * 0.13 * 0.13));
        for(var k = 0; k < CLUSTERS.length; k++){
          var cx = x - CLUSTERS[k][0], cy = y - CLUSTERS[k][1], sg = CLUSTERS[k][2];
          d += 0.9 * Math.exp(-(cx * cx + cy * cy) / (2 * sg * sg));
        }
        return d;
      }
      var D_MAX = 1.9;

      function inCore(x, y){
        var dx = (x - 0.5) / 0.3, dy = (y - 0.45) / 0.07;
        return dx * dx + dy * dy < 1;
      }
      function sample(){
        for(;;){
          var x = 0.01 + rand() * 0.98, y = 0.01 + rand() * 0.97;
          if(!inCore(x, y) && rand() * D_MAX < density(x, y)) return [x, y];
        }
      }

      var pts = [];
      while(pts.length < STAR_COUNT){
        var best = null, bestD = -1;
        for(var ci = 0; ci < CANDIDATES; ci++){
          var p = sample(), d = Infinity;
          for(var j = 0; j < pts.length; j++){
            var ex = pts[j][0] - p[0], ey = pts[j][1] - p[1];
            var dd = ex * ex + ey * ey;
            if(dd < d) d = dd;
          }
          if(d > bestD){ bestD = d; best = p; }
        }
        pts.push(best);
      }

      var frag = document.createDocumentFragment();
      for(var i = 0; i < pts.length; i++){
        var roll = rand();
        // diameter in --s units: a few bright hero points, some medium, most fine
        var dia = roll < 0.04 ? 3.6 + rand() * 0.8
                : roll < 0.16 ? 2.4 + rand() * 0.6
                : 1.4 + rand() * 0.7;
        var hue = rand();
        var color = hue < 0.1 ? 'var(--red-bright)'
                  : hue < 0.2 ? 'var(--ink)'
                  : 'var(--text)';
        var star = document.createElement('span');
        star.className = 'hero-star';
        star.style.setProperty('--d', dia.toFixed(2));
        star.style.left = (pts[i][0] * 100).toFixed(3) + '%';
        star.style.top = (pts[i][1] * 100).toFixed(3) + '%';
        star.style.color = color;
        var dur = 2.4 + rand() * 4;
        star.style.animationDuration = dur.toFixed(2) + 's';
        // negative delay so every star is already mid-twinkle on first paint
        star.style.animationDelay = (-rand() * dur).toFixed(2) + 's';
        frag.appendChild(star);
      }

      if(!reduceMotion) startMeteors(field);
      field.appendChild(frag);
    });

    /* ---------- meteors ----------
       Shooting stars drawn on a canvas over each hero's star field, in
       the brand's red and blue. Each one has a glowing head with a hot
       core, a long trail that tapers and fades behind it (a soft wide
       glow under a thin bright streak), little sparks that shed off the
       head and drift away, and a small flash as it burns out. They fall
       as a loose shower from the upper right, with varied angle, length,
       speed and timing, now and then in pairs. Everything is sized to the
       screen and drawn at the display's pixel density, and the animation
       only runs while the hero is actually on screen. */
    function startMeteors(field){
      var canvas = document.createElement('canvas');
      canvas.className = 'hero-meteors';
      canvas.setAttribute('aria-hidden', 'true');
      field.appendChild(canvas);
      var ctx = canvas.getContext('2d');
      var W = 0, H = 0, S = 1, dpr = 1;
      var PALETTE = [
        {core:'#ff3b44', mid:'190,22,30', deep:'120,0,0', glow:'235,60,66'},     // brand red
        {core:'#2f8fe0', mid:'14,96,150', deep:'0,48,73', glow:'70,150,215'}    // logo blue
      ];
      function size(){
        var r = field.getBoundingClientRect();
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = r.width; H = r.height;
        canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
        canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        S = Math.max(.6, Math.min(1.5, W / 1280));
      }
      size();
      window.addEventListener('resize', size);

      var meteors = [], sparks = [], flashes = [];
      var nextAt = performance.now() + 900, colorFlip = Math.random() < .5 ? 0 : 1;
      function rnd(a, b){ return a + Math.random() * (b - a); }
      function spawn(now, forced){
        var pal = PALETTE[colorFlip]; colorFlip = 1 - colorFlip;
        var ang = (180 - rnd(24, 40)) * Math.PI / 180;   // travelling down and to the left
        var speed = rnd(700, 1150) * S;
        var life = rnd(.75, 1.25);
        var sx = rnd(W * .35, W * 1.05), sy = rnd(-H * .05, H * .38);
        meteors.push({
          x:sx, y:sy, vx:Math.cos(ang) * speed, vy:Math.sin(ang) * speed,
          len:rnd(280, 460) * S, w:rnd(2.8, 4) * S, born:now, life:life, pal:pal,
          sparkAcc:0
        });
        // now and then a second, fainter one follows close behind
        if(!forced && Math.random() < .22){
          setTimeout(function(){ spawn(performance.now(), true); }, rnd(140, 420));
        }
      }
      function draw(now, dt){
        ctx.clearRect(0, 0, W, H);
        // meteors
        for(var i = meteors.length - 1; i >= 0; i--){
          var m = meteors[i];
          var t = (now - m.born) / 1000, p = t / m.life;
          if(p >= 1){
            flashes.push({x:m.x, y:m.y, born:now, pal:m.pal, r:m.w * 2.6});
            meteors.splice(i, 1); continue;
          }
          m.x += m.vx * dt; m.y += m.vy * dt;
          var fade = Math.min(1, p / .14) * Math.min(1, (1 - p) / .35);
          var flick = .88 + .12 * Math.sin(now / 37 + i);
          var a = fade * flick;
          var sp = Math.hypot(m.vx, m.vy), ux = m.vx / sp, uy = m.vy / sp;
          var len = m.len * Math.min(1, p / .2 + .25);
          var tx = m.x - ux * len, ty = m.y - uy * len;
          var nx = -uy, ny = ux;
          // wide soft glow: several stacked layers, each wider and fainter,
          // so the edge falls off smoothly instead of ending in a hard line
          for(var gl = 1; gl <= 5; gl++){
            var g1 = ctx.createLinearGradient(m.x, m.y, tx, ty);
            g1.addColorStop(0, 'rgba(' + m.pal.glow + ',' + (.16 * a) + ')');
            g1.addColorStop(.45, 'rgba(' + m.pal.glow + ',' + (.05 * a) + ')');
            g1.addColorStop(1, 'rgba(' + m.pal.glow + ',0)');
            ctx.fillStyle = g1;
            var gw = m.w * (1 + gl * .9);
            ctx.beginPath();
            ctx.moveTo(m.x + nx * gw, m.y + ny * gw);
            ctx.lineTo(tx, ty);
            ctx.lineTo(m.x - nx * gw, m.y - ny * gw);
            ctx.arc(m.x, m.y, gw, Math.atan2(-ny, -nx), Math.atan2(ny, nx), false);
            ctx.closePath(); ctx.fill();
          }
          // tapered bright streak
          var g2 = ctx.createLinearGradient(m.x, m.y, tx, ty);
          g2.addColorStop(0, 'rgba(' + m.pal.deep + ',' + a + ')');
          g2.addColorStop(.12, 'rgba(' + m.pal.mid + ',' + (.95 * a) + ')');
          g2.addColorStop(.5, 'rgba(' + m.pal.mid + ',' + (.45 * a) + ')');
          g2.addColorStop(1, 'rgba(' + m.pal.mid + ',0)');
          ctx.fillStyle = g2;
          ctx.beginPath();
          ctx.moveTo(m.x + nx * m.w, m.y + ny * m.w);
          ctx.lineTo(tx, ty);
          ctx.lineTo(m.x - nx * m.w, m.y - ny * m.w);
          ctx.closePath(); ctx.fill();
          // glowing head with a hot core
          var hr = m.w * 5.5;
          var g3 = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, hr);
          g3.addColorStop(0, m.pal.core);
          g3.addColorStop(.16, m.pal.core);
          g3.addColorStop(.3, 'rgba(' + m.pal.mid + ',' + (.75 * a) + ')');
          g3.addColorStop(.6, 'rgba(' + m.pal.glow + ',' + (.28 * a) + ')');
          g3.addColorStop(1, 'rgba(' + m.pal.glow + ',0)');
          ctx.globalAlpha = a;
          ctx.fillStyle = g3;
          ctx.beginPath(); ctx.arc(m.x, m.y, hr, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 1;
          // shed sparks
          m.sparkAcc += dt * 34;
          while(m.sparkAcc > 1){
            m.sparkAcc -= 1;
            sparks.push({
              x:m.x - ux * rnd(0, 10) * S, y:m.y - uy * rnd(0, 10) * S,
              vx:-ux * rnd(20, 70) * S + nx * rnd(-40, 40) * S,
              vy:-uy * rnd(20, 70) * S + ny * rnd(-40, 40) * S + 10 * S,
              born:now, life:rnd(.4, .9), r:rnd(1, 2.4) * S, pal:m.pal, a:a
            });
          }
        }
        // sparks
        for(var k = sparks.length - 1; k >= 0; k--){
          var s = sparks[k], st = (now - s.born) / 1000;
          if(st > s.life){ sparks.splice(k, 1); continue; }
          s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 30 * S * dt;
          var sa = (1 - st / s.life) * s.a;
          ctx.fillStyle = 'rgba(' + s.pal.mid + ',' + (.85 * sa) + ')';
          ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
        }
        // burn-out flashes
        for(var f = flashes.length - 1; f >= 0; f--){
          var fl = flashes[f], ft = (now - fl.born) / 1000;
          if(ft > .22){ flashes.splice(f, 1); continue; }
          var fp = ft / .22, fr = fl.r * (1 + fp * .8), fa = (1 - fp) * .45;
          var g4 = ctx.createRadialGradient(fl.x, fl.y, 0, fl.x, fl.y, fr);
          g4.addColorStop(0, 'rgba(' + fl.pal.mid + ',' + fa + ')');
          g4.addColorStop(.3, 'rgba(' + fl.pal.glow + ',' + fa + ')');
          g4.addColorStop(1, 'rgba(' + fl.pal.glow + ',0)');
          ctx.fillStyle = g4;
          ctx.beginPath(); ctx.arc(fl.x, fl.y, fr, 0, Math.PI * 2); ctx.fill();
        }
      }

      var running = false, last = 0, raf = null;
      function frame(now){
        var dt = Math.min(.05, (now - last) / 1000); last = now;
        if(now >= nextAt){ spawn(now); nextAt = now + rnd(1600, 3600); }
        draw(now, dt);
        raf = running ? requestAnimationFrame(frame) : null;
      }
      function setRunning(on){
        if(on && !running){
          running = true; last = performance.now();
          if(nextAt < last) nextAt = last + 600;
          raf = requestAnimationFrame(frame);
        } else if(!on){
          running = false;
        }
      }
      var visible = true;
      if('IntersectionObserver' in window){
        new IntersectionObserver(function(entries){
          visible = entries[0].isIntersecting;
          setRunning(visible && !document.hidden);
        }).observe(field);
      }
      document.addEventListener('visibilitychange', function(){ setRunning(visible && !document.hidden); });
      setRunning(true);
    }

    /* ---------- 3D textured lettering ----------
       The logo wordmarks and the big page titles get the logo's look in
       one SVG filter per element: the concrete texture is stretched
       across the whole word (never tiled, so it never visibly repeats)
       and overlay-blended into the letters' own colour; a lighting pass
       then turns each letter into a softly rounded surface lit from the
       top-left (edges facing the light brighten, far edges fall into
       shade, with a faint sheen); finally it's set on a soft shadow plus
       a tight contact shadow so it lifts off the page. The letters stay
       ordinary coloured text, so colour animations keep working.
       For words split into coloured spans (QUO / VEX / .), every span
       uses the same texture frame offset to its own position, so the
       surface runs continuously across the whole word. Bevel and shadow
       sizes are fractions of the font size, so the small nav logo and
       the huge wordmark look the same. */
    var TEXTURED_SEL = '#heroLogo > span, .nav-logo > span, .portfolio-title, .hire-title, .blog-title';
    var texDefs = null;
    function r2(v){ return (Math.round(v * 100) / 100).toString(); }
    function textureFilter(id, fs, tx, ty, size){
      // a narrow rounded edge only (the face of each letter stays flat),
      // never darker than the letter's own colour, and no shadow behind
      var edge = fs * 0.008, height = fs * 0.018;
      return '<filter id="' + id + '" x="-4%" y="-10%" width="108%" height="130%" color-interpolation-filters="sRGB">' +
          '<feImage href="' + QUOVEX_TEXTURE_URL + '" x="' + r2(tx) + '" y="' + r2(ty) + '" width="' + r2(size) + '" height="' + r2(size) + '" preserveAspectRatio="none" result="tex"/>' +
          '<feBlend in="tex" in2="SourceGraphic" mode="overlay" result="mix"/>' +
          '<feComposite in="mix" in2="SourceAlpha" operator="in" result="surface"/>' +
          '<feGaussianBlur in="SourceAlpha" stdDeviation="' + r2(edge) + '" result="round"/>' +
          // the lit edge: a soft highlight along the edges facing the light
          '<feSpecularLighting in="round" surfaceScale="' + r2(height) + '" specularConstant="1" specularExponent="12" lighting-color="#fff" result="spec">' +
            '<feDistantLight azimuth="225" elevation="35"/></feSpecularLighting>' +
          '<feComposite in="spec" in2="SourceAlpha" operator="in" result="sheen"/>' +
          // the shaded edge: the far edges dip only slightly, as a soft
          // tint of the letter's own colour rather than black
          '<feDiffuseLighting in="round" surfaceScale="' + r2(height) + '" diffuseConstant="1" lighting-color="#fff" result="light">' +
            '<feDistantLight azimuth="225" elevation="60"/></feDiffuseLighting>' +
          '<feComponentTransfer in="light" result="softLight">' +
            '<feFuncR type="linear" slope=".5" intercept=".567"/><feFuncG type="linear" slope=".5" intercept=".567"/><feFuncB type="linear" slope=".5" intercept=".567"/>' +
          '</feComponentTransfer>' +
          '<feComposite in="surface" in2="softLight" operator="arithmetic" k1="1" k2="0" k3="0" k4="0" result="lit"/>' +
          '<feComposite in="lit" in2="SourceAlpha" operator="in" result="body"/>' +
          '<feComposite in="sheen" in2="body" operator="arithmetic" k1="0" k2=".35" k3="1" k4="0"/>' +
        '</filter>';
    }
    function applyTexture3d(){
      if(!texDefs){
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '0'); svg.setAttribute('height', '0');
        svg.setAttribute('aria-hidden', 'true');
        svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
        texDefs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        svg.appendChild(texDefs);
        document.body.appendChild(svg);
      }
      var html = '';
      var els = document.querySelectorAll(TEXTURED_SEL);
      els.forEach(function(el, i){
        var fs = parseFloat(getComputedStyle(el).fontSize);
        if(!fs) return;
        // the texture frame is the whole word (layout positions, so the
        // intro's slide-in transforms don't shift it)
        var frame = el.closest('#heroLogo, .nav-logo') || el;
        var fw = frame.offsetWidth || el.offsetWidth, fh = frame.offsetHeight || el.offsetHeight;
        var size = Math.max(fw, fh * 1.6, 220) * 1.04;
        // the span's position inside the word (offsetLeft is measured from
        // the nearest positioned ancestor, which may be the word itself)
        var dx = 0, dy = 0;
        if(frame !== el){
          dx = el.offsetParent === frame ? el.offsetLeft : el.offsetLeft - frame.offsetLeft;
          dy = el.offsetParent === frame ? el.offsetTop : el.offsetTop - frame.offsetTop;
        }
        var tx = -dx, ty = -dy - fh * .3;
        var id = 'quovex-tex-' + i;
        html += textureFilter(id, fs, tx - size * 0.02, ty, size);
        el.style.filter = 'url(#' + id + ')';
      });
      texDefs.innerHTML = html;
    }
    applyTexture3d();
    if(document.fonts && document.fonts.ready) document.fonts.ready.then(applyTexture3d);
    var texTimer = null;
    window.addEventListener('resize', function(){
      clearTimeout(texTimer);
      texTimer = setTimeout(applyTexture3d, 150);
    });

    /* ---------- one-line titles ----------
       Every section title stays on a single line on any screen: if it
       doesn't fit at its normal size, it's scaled down just enough to. */
    var TITLE_SEL = 'main h2, section h2, .footer h2.headline, .service-name, .process-card h3';
    function fitTitles(){
      document.querySelectorAll(TITLE_SEL).forEach(function(el){
        if(el.closest('.package-modal')) return;
        el.style.fontSize = '';
        el.style.whiteSpace = 'nowrap';
        var avail = el.clientWidth;
        if(!avail) return;
        var need = el.scrollWidth;
        if(need > avail + 1){
          var fs = parseFloat(getComputedStyle(el).fontSize);
          el.style.fontSize = (Math.floor(fs * avail / need * 0.99 * 10) / 10) + 'px';
        }
      });
    }
    fitTitles();
    if(document.fonts && document.fonts.ready) document.fonts.ready.then(fitTitles);
    var fitTimer = null;
    window.addEventListener('resize', function(){
      clearTimeout(fitTimer);
      fitTimer = setTimeout(fitTitles, 120);
    });

    /* ---------- mobile menu: a card that rises out of the dock ---------- */
    var btn = document.getElementById('menuBtn');
    var menu = document.getElementById('mobileMenu');
    if(btn && menu){
      var scrim = document.createElement('div');
      scrim.className = 'menu-scrim';
      document.body.appendChild(scrim);
      var closeMenu = function(){
        menu.classList.remove('open'); scrim.classList.remove('open');
        menu.setAttribute('aria-hidden','true');
        btn.setAttribute('aria-expanded','false'); btn.setAttribute('aria-label','Open menu');
      };
      var openMenu = function(){
        menu.classList.add('open'); scrim.classList.add('open');
        menu.setAttribute('aria-hidden','false');
        btn.setAttribute('aria-expanded','true'); btn.setAttribute('aria-label','Close menu');
        // the dock holds the close button, so it must be showing even if it
        // had slid away while scrolling down
        var bar = document.querySelector('.nav');
        if(bar) bar.classList.remove('is-hidden');
      };
      btn.addEventListener('click', function(){
        if(menu.classList.contains('open')){ closeMenu(); } else { openMenu(); }
      });
      scrim.addEventListener('click', closeMenu);
      menu.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', closeMenu); });
      window.addEventListener('keydown', function(e){ if(e.key === 'Escape') closeMenu(); });
    }

    /* ---------- nav pill: glides behind the hovered link, rests on the
       current page ---------- */
    var navLinks = document.querySelector('.nav-links');
    var pill = navLinks ? navLinks.querySelector('.nav-pill') : null;
    if(navLinks && pill){
      var links = Array.prototype.slice.call(navLinks.querySelectorAll('a'));
      var navCurrent = navLinks.querySelector('a.active');
      var placePill = function(a, instant){
        links.forEach(function(l){ l.classList.toggle('is-under', l === a); });
        if(!a){ pill.classList.remove('is-on'); return; }
        if(instant){ pill.style.transition = 'none'; }
        pill.style.width = a.offsetWidth + 'px';
        pill.style.transform = 'translateX(' + a.offsetLeft + 'px)';
        pill.classList.add('is-on');
        if(instant){ pill.offsetHeight; pill.style.transition = ''; }
      };
      placePill(navCurrent, true);
      links.forEach(function(a){
        a.addEventListener('mouseenter', function(){ placePill(a); });
        a.addEventListener('focus', function(){ placePill(a); });
      });
      navLinks.addEventListener('mouseleave', function(){ placePill(navCurrent); });
      var repill = function(){ placePill(navCurrent, true); };
      window.addEventListener('resize', repill);
      if(document.fonts && document.fonts.ready) document.fonts.ready.then(repill);
    }

    /* (the nav stays on screen at all times: it no longer hides while scrolling) */

    /* ---------- scroll cue fade-out ---------- */
    var scrollCues = document.querySelectorAll('.scroll-cue');
    if(scrollCues.length){
      var updateCues = function(){
        var t = Math.max(0, 1 - window.scrollY / 140);
        scrollCues.forEach(function(c){
          c.style.opacity = t;
          c.style.pointerEvents = t > 0.05 ? 'auto' : 'none';
        });
      };
      updateCues();
      window.addEventListener('scroll', updateCues, {passive:true});
    }

    /* ---------- ambient brand-dot flicker ----------
       Every ~15s, every "." in a QUOVEX wordmark on the page (nav,
       footer, hero — wherever .brand-dot appears) does a quick
       light-bulb-style flicker and swaps between the brand's red and
       ink, looping forever. It reads the dot's actual current color
       each time (rather than assuming it starts at ink) so it hands off
       cleanly from anything else that may have already changed it —
       e.g. the home page's intro preloader, which leaves it on red. */
    // the footer's dot stays white on the red footer, so it sits this out
    var brandDots = Array.prototype.filter.call(document.querySelectorAll('.brand-dot'), function(d){
      return !d.closest('.footer-logo');
    });
    if(brandDots.length){
      var dotReduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      var probe = document.createElement('span');
      probe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none';
      document.body.appendChild(probe);
      function computedColorFor(varName){
        probe.style.color = 'var(' + varName + ')';
        return getComputedStyle(probe).color;
      }
      var INK_RGB = computedColorFor('--ink');
      var RED_RGB = computedColorFor('--red');

      var DOT_FLICKER_OFFSETS = [0, 18, 32, 50, 65, 85, 100, 120, 140, 160, 180, 205, 230, 255, 280];
      var DOT_FLICKER_IS_TARGET = [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1]; // ends on the target color

      function flickerDots(){
        var startsInk = getComputedStyle(brandDots[0]).color === INK_RGB;
        var startColor = startsInk ? INK_RGB : RED_RGB;
        var targetColor = startsInk ? RED_RGB : INK_RGB;

        if(dotReduceMotion){
          brandDots.forEach(function(d){ d.style.color = targetColor; });
          return;
        }
        DOT_FLICKER_OFFSETS.forEach(function(t, i){
          setTimeout(function(){
            var c = DOT_FLICKER_IS_TARGET[i] ? targetColor : startColor;
            brandDots.forEach(function(d){ d.style.color = c; });
          }, t);
        });
      }
      setInterval(flickerDots, 15000);
    }

    /* ---------- scroll reveal: fade + blur in, one time, as content
       enters the viewport. Elements sharing a batch (e.g. a row of
       cards that cross the threshold in the same frame) get a small
       staggered delay instead of popping in together. ---------- */
    var revealEls = document.querySelectorAll('.reveal');
    if(revealEls.length){
      var revealReduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if(revealReduceMotion || !('IntersectionObserver' in window)){
        revealEls.forEach(function(el){ el.classList.add('is-visible'); });
      } else {
        var REVEAL_TRANSITION = 'opacity .7s cubic-bezier(.16,1,.3,1), filter .7s cubic-bezier(.16,1,.3,1), transform .7s cubic-bezier(.16,1,.3,1)';
        var revealIo = new IntersectionObserver(function(entries, obs){
          entries.filter(function(e){ return e.isIntersecting; }).forEach(function(entry, i){
            var el = entry.target;
            obs.unobserve(el);
            // set inline, right before the class flip, and cleared again
            // once the transition ends — see the CSS comment on .reveal
            // for why this can't just live in the stylesheet
            el.style.transition = REVEAL_TRANSITION;
            el.style.transitionDelay = (Math.min(i, 5) * 60) + 'ms';
            requestAnimationFrame(function(){
              requestAnimationFrame(function(){ el.classList.add('is-visible'); });
            });
            el.addEventListener('transitionend', function(){
              el.style.transition = '';
              el.style.transitionDelay = '';
            }, {once:true});
          });
        // fires as soon as any part of an element is a little way into the
        // viewport, so content is already there by the time the eye gets
        // to it instead of leaving blank gaps while scrolling
        }, {threshold:0, rootMargin:'0px 0px -4% 0px'});
        revealEls.forEach(function(el){ revealIo.observe(el); });
      }
    }

    /* ---------- smooth scroll with a little resistance ---------- */
    if('onwheel' in window){
      var current = window.scrollY;
      var target = window.scrollY;
      var ease = 0.14;
      var scrollRaf = null;
      var selfScrolling = false;

      function maxScroll(){
        return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      }
      function clamp(v){
        return Math.max(0, Math.min(v, maxScroll()));
      }
      function step(){
        current += (target - current) * ease;
        if(Math.abs(target - current) < 0.4){
          current = target;
          selfScrolling = true;
          window.scrollTo(0, current);
          selfScrolling = false;
          scrollRaf = null;
          return;
        }
        selfScrolling = true;
        window.scrollTo(0, current);
        selfScrolling = false;
        scrollRaf = requestAnimationFrame(step);
      }
      window.addEventListener('wheel', function(e){
        if(e.ctrlKey) return;
        // A modal/floating window is open (package-modal or niche-modal):
        // let the browser's native wheel behavior run instead of hijacking
        // it, so it scrolls whatever scrollable element is under the
        // cursor (the modal's own inner scroll area) rather than always
        // driving the background page via window.scrollTo.
        if(document.body.classList.contains('modal-open') || document.body.classList.contains('niche-modal-open')) return;
        e.preventDefault();
        target = clamp(target + e.deltaY);
        if(!scrollRaf){ scrollRaf = requestAnimationFrame(step); }
      }, {passive:false});

      var syncTimer = null;
      window.addEventListener('scroll', function(){
        if(selfScrolling) return;
        clearTimeout(syncTimer);
        syncTimer = setTimeout(function(){
          current = window.scrollY;
          target = current;
        }, 50);
      }, {passive:true});

      window.addEventListener('resize', function(){
        target = clamp(target);
      });
    }

  });
})();

/* ---------- custom cursor: a plain circle blended with the page via
   mix-blend-mode:difference (see assets/site.css), so it inverts whatever
   color is underneath automatically — no per-element color sampling.
   Grows over clickable elements, presses inward on click. Runs on every
   page that includes a #cxWrap element. ---------- */
(function(){
  if(!window.matchMedia || !window.matchMedia('(pointer: fine)').matches) return;

  var wrap = document.getElementById('cxWrap');
  if(!wrap) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mx = window.innerWidth / 2, my = window.innerHeight / 2;
  var x = mx, y = my;
  var scale = 1;
  var started = false, down = false, hovering = false;

  document.addEventListener('mousemove', function(e){
    mx = e.clientX; my = e.clientY;
    if(!started){
      started = true;
      x = mx; y = my;
      wrap.classList.add('is-active');
    }
  }, {passive:true});

  document.addEventListener('mouseleave', function(){ wrap.classList.remove('is-active'); });
  document.addEventListener('mouseenter', function(){ if(started) wrap.classList.add('is-active'); });
  document.addEventListener('mousedown', function(){ down = true; });
  document.addEventListener('mouseup', function(){ down = false; });

  var INTERACTIVE_SEL = 'a, button, input, textarea, select, [role="button"], ' +
    '.niche-box, .niche-item, .package-bar, .work-item, .package-modal-close, .whatsapp-float';
  document.addEventListener('mouseover', function(e){
    if(e.target.closest && e.target.closest(INTERACTIVE_SEL)) hovering = true;
  });
  document.addEventListener('mouseout', function(e){
    var toEl = e.target.closest ? e.target.closest(INTERACTIVE_SEL) : null;
    var fromRelated = e.relatedTarget && e.relatedTarget.closest ? e.relatedTarget.closest(INTERACTIVE_SEL) : null;
    if(toEl && !fromRelated) hovering = false;
  });

  function frame(){
    var lag = reduceMotion ? 1 : 0.32;
    x += (mx - x) * lag;
    y += (my - y) * lag;

    var targetScale = down ? (hovering ? 1.7 : 0.7) : (hovering ? 2.1 : 1);
    scale += (targetScale - scale) * 0.25;

    wrap.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) scale(' + scale.toFixed(3) + ')';
    requestAnimationFrame(frame);
  }
  frame();
})();

/* ---------- a small hello for anyone who opens devtools — the "web
   engineering" half of the brand, proven rather than just claimed ---------- */
(function(){
  if(!window.console || !console.log) return;
  console.log('%cQUOVEX.', 'color:#780000;font-weight:700;font-size:20px;font-family:sans-serif');
  console.log('%cLooking under the hood already? Good instinct — that\'s half of what we do.', 'color:#003049;font-size:12px;font-family:sans-serif');
})();
