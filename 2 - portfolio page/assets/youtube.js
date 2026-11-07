/* =====================================================================
   VIDEOS ON YOUTUBE
   Paste each video's YouTube link (or just its ID) next to its file name.
   Upload them as "Unlisted": only people with the link (your website's
   visitors) can watch them, and they don't show up on your channel or
   in YouTube search.

   A video with a link here plays from YouTube; a video left empty keeps
   playing from the file in assets/video. So you can switch them over
   one at a time, and once every one here has a link, the .mp4 files
   don't need to be uploaded with the website at all.
   ===================================================================== */
var QUOVEX_YOUTUBE = {
  // Home page: "Full ads" reels
  'ad1-web.mp4': '',
  'ad2-web.mp4': '',
  'ad3-web.mp4': '',
  // Home page: the two films
  'quovex-intro.mp4': '',
  'onboarding-web.mp4': '',
  // Portfolio: the iPad reel at the top (one link covers both sizes)
  'portfolio-reel.mp4': '',
  // Portfolio: Reels, TikToks & Shorts
  'ahmad-realestate.mp4': '',
  'lake-nona-home-tour.mp4': '',
  'zeeya-1.mp4': '',
  'zeeya-2.mp4': '',
  'zeeya-3.mp4': '',
  'rkd-1.mp4': '',
  'ahmad-clipping.mp4': '',
  'ahmad-meta-ads.mp4': '',
  // Portfolio: Software & app demos
  'saas-rerun.mp4': '',
  'saas-babbel.mp4': '',
  'saas-grammarly.mp4': '',
  'saas-gemini.mp4': '',
  'saas-codxna.mp4': '',
  'saas-seo.mp4': '',
  'saas-fashion.mp4': ''
};

(function(){
  // accepts a full link (youtu.be/…, youtube.com/watch?v=…, /shorts/…, /embed/…) or a bare ID
  function idFrom(raw){
    if(!raw) return null;
    raw = String(raw).trim();
    var m = raw.match(/(?:youtu\.be\/|v=|\/shorts\/|\/embed\/|\/live\/)([A-Za-z0-9_-]{11})/);
    if(m) return m[1];
    return /^[A-Za-z0-9_-]{11}$/.test(raw) ? raw : null;
  }
  window.quovexYouTubeId = function(fileOrPath){
    if(!fileOrPath) return null;
    var name = String(fileOrPath).split('?')[0].split('/').pop();
    if(name === 'portfolio-reel-sm.mp4') name = 'portfolio-reel.mp4';
    return idFrom(QUOVEX_YOUTUBE[name]);
  };

  // load YouTube's player script once, only when a YouTube video is used
  var apiReady = null;
  function loadApi(){
    if(apiReady) return apiReady;
    apiReady = new Promise(function(resolve){
      if(window.YT && window.YT.Player) return resolve();
      var prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function(){ if(prev) prev(); resolve(); };
      var s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(s);
    });
    return apiReady;
  }

  /* A YouTube video that behaves like the site's <video> elements: it
     takes the place of one and answers to the same things the existing
     players use (play, pause, muted, loop, currentTime, duration,
     paused, and the play / timeupdate / ended / canplay events).
     opts.controls: show YouTube's controls (films) or not (reels, iPad);
     opts.cover: put a clear layer on top so clicks go to the website. */
  function QuovexYouTubeVideo(videoEl, id, opts){
    opts = opts || {};
    var self = this;
    this._listeners = {};
    this._muted = opts.muted !== false;
    this._loop = !!opts.loop;
    this._paused = true;
    this._ready = false;
    this._queue = [];

    var host = document.createElement('div');
    host.className = (videoEl.className || '') + ' yt-host';
    if(videoEl.id) host.id = videoEl.id;
    var mount = document.createElement('div');
    host.appendChild(mount);
    if(opts.cover){
      var shield = document.createElement('span');
      shield.className = 'yt-shield';
      host.appendChild(shield);
    }
    videoEl.parentNode.replaceChild(host, videoEl);
    this.element = host;

    loadApi().then(function(){
      self._player = new YT.Player(mount, {
        host: 'https://www.youtube-nocookie.com',
        videoId: id,
        width: '100%', height: '100%',
        playerVars: {
          autoplay: opts.autoplay ? 1 : 0,
          mute: self._muted ? 1 : 0,
          controls: opts.controls ? 1 : 0,
          playsinline: 1, rel: 0, modestbranding: 1,
          iv_load_policy: 3, disablekb: opts.controls ? 0 : 1, fs: opts.controls ? 1 : 0,
          origin: location.origin && location.origin !== 'null' ? location.origin : undefined
        },
        events: {
          onReady: function(){
            self._ready = true;
            if(self._muted) self._player.mute(); else self._player.unMute();
            self._queue.forEach(function(fn){ fn(); });
            self._queue = [];
            self._emit('canplay');
          },
          onStateChange: function(e){
            if(e.data === 1){ self._paused = false; self._emit('play'); self._tick(); }
            else if(e.data === 2){ self._paused = true; self._emit('pause'); }
            else if(e.data === 0){
              if(self._loop){ self._player.seekTo(0, true); self._player.playVideo(); }
              else { self._paused = true; self._emit('ended'); }
            }
          }
        }
      });
    });
  }
  QuovexYouTubeVideo.prototype = {
    _do: function(fn){ if(this._ready) fn(); else this._queue.push(fn); },
    _emit: function(type){ (this._listeners[type] || []).forEach(function(fn){ try { fn(); } catch(e){} }); },
    _tick: function(){
      var self = this;
      if(this._timer) return;
      this._timer = setInterval(function(){
        if(self._paused){ clearInterval(self._timer); self._timer = null; return; }
        self._emit('timeupdate');
      }, 250);
    },
    addEventListener: function(type, fn){ (this._listeners[type] = this._listeners[type] || []).push(fn); },
    removeEventListener: function(type, fn){ var l = this._listeners[type] || []; var i = l.indexOf(fn); if(i > -1) l.splice(i, 1); },
    play: function(){ var self = this; this._do(function(){ self._player.playVideo(); }); return Promise.resolve(); },
    pause: function(){ var self = this; this._paused = true; this._do(function(){ self._player.pauseVideo(); }); },
    get paused(){ return this._paused; },
    get muted(){ return this._muted; },
    set muted(v){ var self = this; this._muted = !!v; this._do(function(){ if(self._muted) self._player.mute(); else self._player.unMute(); }); },
    get loop(){ return this._loop; },
    set loop(v){ this._loop = !!v; },
    get currentTime(){ return this._ready && this._player.getCurrentTime ? this._player.getCurrentTime() : 0; },
    set currentTime(t){ var self = this; this._do(function(){ self._player.seekTo(t, true); }); },
    get duration(){ return this._ready && this._player.getDuration ? this._player.getDuration() : 0; },
    set controls(v){ /* fixed when the player is created */ },
    set defaultMuted(v){}
  };

  /* swap a <video> for its YouTube version if it has a link above */
  window.quovexMaybeYouTube = function(videoEl, opts){
    if(!videoEl) return videoEl;
    var src = videoEl.getAttribute('src') || (videoEl.querySelector('source') || {}).src || '';
    var id = window.quovexYouTubeId(src);
    return id ? new QuovexYouTubeVideo(videoEl, id, opts) : videoEl;
  };
  window.QuovexYouTubeVideo = QuovexYouTubeVideo;
})();
