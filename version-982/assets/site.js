(function() {
  var hlsPromise = null;

  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function normalize(value) {
    return String(value || "").toLowerCase().trim();
  }

  function loadHls() {
    if (window.Hls) {
      return Promise.resolve(window.Hls);
    }
    if (hlsPromise) {
      return hlsPromise;
    }
    hlsPromise = new Promise(function(resolve, reject) {
      var script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/hls.js@1/dist/hls.min.js";
      script.onload = function() {
        resolve(window.Hls);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
    return hlsPromise;
  }

  function attachStream(video, streamUrl) {
    if (!video || !streamUrl || video.dataset.ready === "1") {
      return Promise.resolve();
    }
    video.dataset.ready = "1";
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = streamUrl;
      return Promise.resolve();
    }
    return loadHls().then(function(Hls) {
      if (Hls && Hls.isSupported()) {
        var hls = new Hls({ enableWorker: true, lowLatencyMode: true });
        hls.loadSource(streamUrl);
        hls.attachMedia(video);
        video._hlsInstance = hls;
      } else {
        video.src = streamUrl;
      }
    }).catch(function() {
      video.src = streamUrl;
    });
  }

  window.initMoviePlayer = function(video, streamUrl, layer) {
    if (!video || !streamUrl) {
      return;
    }
    var start = function() {
      attachStream(video, streamUrl).then(function() {
        if (layer) {
          layer.classList.add("is-hidden");
        }
        var playResult = video.play();
        if (playResult && typeof playResult.catch === "function") {
          playResult.catch(function() {});
        }
      });
    };
    if (layer) {
      layer.addEventListener("click", start);
    }
    video.addEventListener("click", function() {
      if (video.paused) {
        start();
      }
    });
  };

  function setupMenu() {
    var button = qs("[data-menu-button]");
    var panel = qs("[data-mobile-panel]");
    if (!button || !panel) {
      return;
    }
    button.addEventListener("click", function() {
      panel.classList.toggle("is-open");
    });
  }

  function setupHero() {
    var hero = qs("[data-hero-carousel]");
    if (!hero) {
      return;
    }
    var slides = qsa(".hero-slide", hero);
    var dots = qsa(".hero-dot", hero);
    if (!slides.length) {
      return;
    }
    var index = 0;
    var show = function(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function(slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === index);
      });
      dots.forEach(function(dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === index);
      });
    };
    dots.forEach(function(dot) {
      dot.addEventListener("click", function() {
        show(Number(dot.getAttribute("data-hero-index")) || 0);
      });
    });
    setInterval(function() {
      show(index + 1);
    }, 5600);
  }

  function readQuery() {
    var params = new URLSearchParams(window.location.search);
    return params.get("q") || "";
  }

  function filterGrid(targetSelector) {
    var grid = qs(targetSelector);
    if (!grid) {
      return;
    }
    var cards = qsa(".searchable-card", grid);
    var inputs = qsa("[data-target='" + targetSelector + "']");
    var empty = qs("[data-empty-state]");
    var query = "";
    var year = "";
    var type = "";
    inputs.forEach(function(input) {
      if (input.hasAttribute("data-local-filter")) {
        query = normalize(input.value);
      }
      if (input.hasAttribute("data-year-filter")) {
        year = normalize(input.value);
      }
      if (input.hasAttribute("data-type-filter")) {
        type = normalize(input.value);
      }
    });
    var visible = 0;
    cards.forEach(function(card) {
      var haystack = normalize([
        card.getAttribute("data-title"),
        card.getAttribute("data-genre"),
        card.getAttribute("data-year"),
        card.getAttribute("data-type"),
        card.getAttribute("data-region")
      ].join(" "));
      var matchQuery = !query || haystack.indexOf(query) !== -1;
      var matchYear = !year || normalize(card.getAttribute("data-year")) === year;
      var matchType = !type || normalize(card.getAttribute("data-type")) === type;
      var isVisible = matchQuery && matchYear && matchType;
      card.style.display = isVisible ? "" : "none";
      if (isVisible) {
        visible += 1;
      }
    });
    if (empty) {
      empty.classList.toggle("is-visible", visible === 0);
    }
  }

  function setupFilters() {
    var controls = qsa("[data-local-filter], [data-year-filter], [data-type-filter]");
    var grouped = {};
    controls.forEach(function(control) {
      var target = control.getAttribute("data-target");
      if (!target) {
        return;
      }
      grouped[target] = true;
      control.addEventListener("input", function() {
        filterGrid(target);
      });
      control.addEventListener("change", function() {
        filterGrid(target);
      });
    });
    var query = readQuery();
    if (query) {
      controls.forEach(function(control) {
        if (control.hasAttribute("data-local-filter")) {
          control.value = query;
        }
      });
    }
    Object.keys(grouped).forEach(filterGrid);
  }

  document.addEventListener("DOMContentLoaded", function() {
    setupMenu();
    setupHero();
    setupFilters();
  });
})();
