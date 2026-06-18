(function () {
  var body = document.body;
  var root = body ? body.getAttribute("data-root") || "./" : "./";

  function joinRoot(path) {
    return root + path.replace(/^\.\//, "");
  }

  function setupMenu() {
    var header = document.querySelector(".site-header");
    var toggle = document.querySelector(".nav-toggle");
    if (!header || !toggle) {
      return;
    }
    toggle.addEventListener("click", function () {
      var open = header.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  function setupHero() {
    var slides = Array.prototype.slice.call(document.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(document.querySelectorAll("[data-hero-dot]"));
    var prev = document.querySelector("[data-hero-prev]");
    var next = document.querySelector("[data-hero-next]");
    if (!slides.length) {
      return;
    }
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("is-active", i === index);
      });
    }

    function play() {
      clearInterval(timer);
      timer = setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        show(i);
        play();
      });
    });

    if (prev) {
      prev.addEventListener("click", function () {
        show(index - 1);
        play();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        show(index + 1);
        play();
      });
    }

    play();
  }

  function setupSearch() {
    var forms = Array.prototype.slice.call(document.querySelectorAll("[data-search-form]"));
    var data = window.SEARCH_INDEX || [];
    forms.forEach(function (form) {
      var input = form.querySelector("[data-search-input]");
      var results = form.querySelector("[data-search-results]");
      if (!input || !results) {
        return;
      }

      function render() {
        var query = input.value.trim().toLowerCase();
        if (!query) {
          results.classList.remove("is-open");
          results.innerHTML = "";
          return;
        }
        var matches = data.filter(function (item) {
          return item.search.indexOf(query) !== -1;
        }).slice(0, 8);
        if (!matches.length) {
          results.innerHTML = '<div class="search-result"><div></div><div><strong>暂无匹配内容</strong><span>换个关键词试试</span></div></div>';
          results.classList.add("is-open");
          return;
        }
        results.innerHTML = matches.map(function (item) {
          return '<a class="search-result" href="' + joinRoot(item.url) + '">' +
            '<img src="' + joinRoot(item.cover) + '" alt="' + escapeHtml(item.title) + '">' +
            '<span><strong>' + escapeHtml(item.title) + '</strong><span>' + escapeHtml(item.region + ' · ' + item.genre + ' · ' + item.year) + '</span></span>' +
          '</a>';
        }).join("");
        results.classList.add("is-open");
      }

      input.addEventListener("input", render);
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var first = results.querySelector("a");
        if (first) {
          window.location.href = first.href;
        }
      });
      document.addEventListener("click", function (event) {
        if (!form.contains(event.target)) {
          results.classList.remove("is-open");
        }
      });
    });
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, function (char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        "\"": "&quot;"
      }[char];
    });
  }

  function setupLocalFilters() {
    var panel = document.querySelector("[data-filter-panel]");
    if (!panel) {
      return;
    }
    var cards = Array.prototype.slice.call(document.querySelectorAll(".movie-card"));
    var titleInput = panel.querySelector('[data-local-filter="title"]');
    var selects = Array.prototype.slice.call(panel.querySelectorAll("select[data-local-filter]"));

    selects.forEach(function (select) {
      var key = select.getAttribute("data-local-filter");
      var values = [];
      cards.forEach(function (card) {
        var value = card.getAttribute("data-" + key) || "";
        if (value && values.indexOf(value) === -1) {
          values.push(value);
        }
      });
      values.sort().forEach(function (value) {
        var option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        select.appendChild(option);
      });
    });

    function apply() {
      var title = titleInput ? titleInput.value.trim().toLowerCase() : "";
      var criteria = {};
      selects.forEach(function (select) {
        criteria[select.getAttribute("data-local-filter")] = select.value;
      });
      cards.forEach(function (card) {
        var visible = true;
        if (title && (card.getAttribute("data-title") || "").toLowerCase().indexOf(title) === -1) {
          visible = false;
        }
        Object.keys(criteria).forEach(function (key) {
          if (criteria[key] && card.getAttribute("data-" + key) !== criteria[key]) {
            visible = false;
          }
        });
        card.style.display = visible ? "" : "none";
      });
    }

    if (titleInput) {
      titleInput.addEventListener("input", apply);
    }
    selects.forEach(function (select) {
      select.addEventListener("change", apply);
    });
  }

  function bindPlayer(videoId, buttonId, streamUrl) {
    var video = document.getElementById(videoId);
    var button = document.getElementById(buttonId);
    if (!video || !button || !streamUrl) {
      return;
    }
    var started = false;
    var hls = null;

    function attach() {
      if (started) {
        return;
      }
      started = true;
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = streamUrl;
      } else if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(streamUrl);
        hls.attachMedia(video);
      } else {
        video.src = streamUrl;
      }
    }

    function play() {
      attach();
      button.classList.add("is-hidden");
      var promise = video.play();
      if (promise && typeof promise.catch === "function") {
        promise.catch(function () {});
      }
    }

    button.addEventListener("click", play);
    video.addEventListener("click", function () {
      if (!started || video.paused) {
        play();
      }
    });
    video.addEventListener("play", function () {
      button.classList.add("is-hidden");
    });
    video.addEventListener("ended", function () {
      if (hls && typeof hls.destroy === "function") {
        hls.destroy();
        hls = null;
      }
      started = false;
    });
  }

  window.SitePlayer = {
    bind: bindPlayer
  };

  document.addEventListener("DOMContentLoaded", function () {
    setupMenu();
    setupHero();
    setupSearch();
    setupLocalFilters();
  });
})();
