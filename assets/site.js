(function () {
  var toggle = document.querySelector("[data-menu-toggle]");
  var panel = document.querySelector("[data-mobile-panel]");
  if (toggle && panel) {
    toggle.addEventListener("click", function () {
      panel.classList.toggle("is-open");
    });
  }

  var slides = Array.prototype.slice.call(document.querySelectorAll("[data-hero-slide]"));
  var dots = Array.prototype.slice.call(document.querySelectorAll("[data-hero-dot]"));
  var current = 0;

  function showSlide(index) {
    if (!slides.length) {
      return;
    }
    current = (index + slides.length) % slides.length;
    slides.forEach(function (slide, i) {
      slide.classList.toggle("is-active", i === current);
    });
    dots.forEach(function (dot, i) {
      dot.classList.toggle("is-active", i === current);
    });
  }

  dots.forEach(function (dot, index) {
    dot.addEventListener("click", function () {
      showSlide(index);
    });
  });

  if (slides.length > 1) {
    window.setInterval(function () {
      showSlide(current + 1);
    }, 5200);
  }

  var searchInput = document.querySelector("[data-search-input]");
  var filterButtons = Array.prototype.slice.call(document.querySelectorAll("[data-filter-button]"));
  var cards = Array.prototype.slice.call(document.querySelectorAll("[data-search-card]"));
  var activeFilter = "";

  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function applyFilters() {
    var query = normalize(searchInput ? searchInput.value : "");
    var filter = normalize(activeFilter);
    cards.forEach(function (card) {
      var text = normalize(card.getAttribute("data-filter-text") || card.textContent);
      var matchedQuery = !query || text.indexOf(query) !== -1;
      var matchedFilter = !filter || text.indexOf(filter) !== -1;
      card.style.display = matchedQuery && matchedFilter ? "" : "none";
    });
  }

  if (searchInput && cards.length) {
    var params = new URLSearchParams(window.location.search);
    var q = params.get("q");
    if (q) {
      searchInput.value = q;
    }
    searchInput.addEventListener("input", applyFilters);
    applyFilters();
  }

  filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      activeFilter = button.getAttribute("data-filter-value") || "";
      filterButtons.forEach(function (item) {
        item.classList.toggle("is-current", item === button);
      });
      applyFilters();
    });
  });
})();

function initializeMoviePlayer(source) {
  var video = document.getElementById("player");
  var button = document.getElementById("playerStart");
  var loaded = false;
  var hlsPlayer = null;

  if (!video || !source) {
    return;
  }

  function hideButton() {
    if (button) {
      button.classList.add("is-hidden");
    }
  }

  function startPlayer() {
    hideButton();
    if (!loaded) {
      loaded = true;
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = source;
        video.addEventListener("loadedmetadata", function () {
          video.play().catch(function () {});
        }, { once: true });
      } else if (window.Hls && window.Hls.isSupported()) {
        hlsPlayer = new window.Hls({ enableWorker: true, lowLatencyMode: true });
        hlsPlayer.loadSource(source);
        hlsPlayer.attachMedia(video);
        hlsPlayer.on(window.Hls.Events.MANIFEST_PARSED, function () {
          video.play().catch(function () {});
        });
        hlsPlayer.on(window.Hls.Events.ERROR, function (_, data) {
          if (!data || !data.fatal) {
            return;
          }
          if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
            hlsPlayer.startLoad();
          } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
            hlsPlayer.recoverMediaError();
          } else {
            hlsPlayer.destroy();
          }
        });
      } else {
        video.src = source;
      }
    }
    video.play().catch(function () {});
  }

  if (button) {
    button.addEventListener("click", startPlayer);
  }

  video.addEventListener("click", function () {
    if (video.paused) {
      startPlayer();
    }
  });
}
