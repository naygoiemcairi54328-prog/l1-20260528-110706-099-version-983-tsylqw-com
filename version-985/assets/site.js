(function() {
  var Site = {};

  Site.initMenu = function() {
    var button = document.querySelector("[data-menu-button]");
    var menu = document.querySelector("[data-mobile-nav]");
    if (!button || !menu) {
      return;
    }
    button.addEventListener("click", function() {
      menu.classList.toggle("is-open");
    });
  };

  Site.initHero = function() {
    var root = document.querySelector("[data-hero]");
    if (!root) {
      return;
    }
    var slides = Array.prototype.slice.call(root.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(root.querySelectorAll("[data-hero-dot]"));
    if (!slides.length) {
      return;
    }
    var index = 0;
    var timer = null;

    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function(slide, i) {
        slide.classList.toggle("is-active", i === index);
      });
      dots.forEach(function(dot, i) {
        dot.classList.toggle("is-active", i === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function() {
        show(index + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function(dot) {
      dot.addEventListener("click", function() {
        var next = Number(dot.getAttribute("data-hero-dot"));
        show(next);
        start();
      });
    });

    root.addEventListener("mouseenter", stop);
    root.addEventListener("mouseleave", start);
    start();
  };

  Site.initFilters = function() {
    var panels = Array.prototype.slice.call(document.querySelectorAll(".filter-panel"));
    panels.forEach(function(panel) {
      var input = panel.querySelector("[data-filter-input]");
      var reset = panel.querySelector("[data-filter-reset]");
      var scope = panel.parentElement || document;
      var cards = Array.prototype.slice.call(scope.querySelectorAll("[data-card]"));
      if (!cards.length) {
        cards = Array.prototype.slice.call(document.querySelectorAll("[data-card]"));
      }
      if (!input || !cards.length) {
        return;
      }

      function apply() {
        var value = input.value.trim().toLowerCase();
        cards.forEach(function(card) {
          var haystack = (card.getAttribute("data-search") || "").toLowerCase();
          card.hidden = value && haystack.indexOf(value) === -1;
        });
      }

      input.addEventListener("input", apply);
      if (reset) {
        reset.addEventListener("click", function() {
          input.value = "";
          apply();
          input.focus();
        });
      }
    });
  };

  Site.initPlayer = function(videoSource) {
    var video = document.getElementById("movieVideo");
    var button = document.getElementById("playButton");
    if (!video || !videoSource) {
      return;
    }

    var loaded = false;
    var hlsInstance = null;

    function attachSource() {
      if (loaded) {
        return Promise.resolve();
      }
      loaded = true;
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = videoSource;
        return Promise.resolve();
      }
      if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: false
        });
        hlsInstance.loadSource(videoSource);
        hlsInstance.attachMedia(video);
        return new Promise(function(resolve) {
          var done = false;
          function finish() {
            if (!done) {
              done = true;
              resolve();
            }
          }
          hlsInstance.on(window.Hls.Events.MEDIA_ATTACHED, finish);
          hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, finish);
          window.setTimeout(finish, 500);
        });
      }
      video.src = videoSource;
      return Promise.resolve();
    }

    function startPlayback() {
      if (button) {
        button.classList.add("is-hidden");
      }
      attachSource().then(function() {
        var playPromise = video.play();
        if (playPromise && playPromise.catch) {
          playPromise.catch(function() {
            if (button) {
              button.classList.remove("is-hidden");
            }
          });
        }
      });
    }

    if (button) {
      button.addEventListener("click", startPlayback);
    }
    video.addEventListener("click", function() {
      if (!loaded) {
        startPlayback();
      }
    });
    window.addEventListener("beforeunload", function() {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  };

  document.addEventListener("DOMContentLoaded", function() {
    Site.initMenu();
    Site.initHero();
    Site.initFilters();
  });

  window.Site = Site;
})();
