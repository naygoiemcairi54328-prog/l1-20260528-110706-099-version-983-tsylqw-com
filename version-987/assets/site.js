(function () {
  function selectAll(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function normalizeText(value) {
    return String(value || '').toLowerCase().trim();
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function setupMenu() {
    var button = document.querySelector('[data-menu-toggle]');
    var panel = document.querySelector('[data-mobile-panel]');
    if (!button || !panel) {
      return;
    }
    button.addEventListener('click', function () {
      panel.classList.toggle('is-open');
      document.body.classList.toggle('is-menu-open', panel.classList.contains('is-open'));
    });
  }

  function setupTopSearch() {
    selectAll('[data-top-search]').forEach(function (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        var input = form.querySelector('input[name="q"]');
        var q = input ? input.value.trim() : '';
        var action = form.getAttribute('action') || 'search.html';
        if (q) {
          window.location.href = action + '?q=' + encodeURIComponent(q);
        } else {
          window.location.href = action;
        }
      });
    });
  }

  function setupHero() {
    var hero = document.querySelector('[data-hero]');
    if (!hero) {
      return;
    }
    var slides = selectAll('[data-hero-slide]', hero);
    var dots = selectAll('[data-hero-dot]', hero);
    if (!slides.length) {
      return;
    }
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener('click', function () {
        show(dotIndex);
        start();
      });
    });

    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    show(0);
    start();
  }

  function setupImageFallbacks() {
    selectAll('img[data-cover]').forEach(function (img) {
      img.addEventListener('error', function () {
        var holder = img.closest('.poster-wrap, .detail-poster, .recommend-poster, .hero-poster, .rank-thumb');
        if (holder) {
          holder.classList.add('image-missing');
        }
      }, { once: true });
    });
  }

  function setupLocalFilters() {
    selectAll('[data-local-filter]').forEach(function (box) {
      var input = box.querySelector('[data-filter-keyword]');
      var typeSelect = box.querySelector('[data-filter-type]');
      var yearSelect = box.querySelector('[data-filter-year]');
      var scope = document.querySelector(box.getAttribute('data-local-filter') || '[data-card-scope]');
      var cards = scope ? selectAll('[data-movie-card]', scope) : [];
      if (!cards.length) {
        return;
      }

      function apply() {
        var keyword = normalizeText(input && input.value);
        var type = typeSelect ? typeSelect.value : '';
        var year = yearSelect ? yearSelect.value : '';
        cards.forEach(function (card) {
          var haystack = normalizeText(card.getAttribute('data-title') + ' ' + card.getAttribute('data-genre') + ' ' + card.getAttribute('data-region'));
          var visible = true;
          if (keyword && haystack.indexOf(keyword) === -1) {
            visible = false;
          }
          if (type && card.getAttribute('data-type') !== type) {
            visible = false;
          }
          if (year && card.getAttribute('data-year') !== year) {
            visible = false;
          }
          card.style.display = visible ? '' : 'none';
        });
      }

      [input, typeSelect, yearSelect].forEach(function (control) {
        if (control) {
          control.addEventListener('input', apply);
          control.addEventListener('change', apply);
        }
      });
      apply();
    });
  }

  function setupSearchPage() {
    var app = document.querySelector('[data-search-page]');
    if (!app || !window.MOVIES) {
      return;
    }
    var form = app.querySelector('[data-search-form]');
    var input = app.querySelector('[name="q"]');
    var type = app.querySelector('[name="type"]');
    var year = app.querySelector('[name="year"]');
    var region = app.querySelector('[name="region"]');
    var results = app.querySelector('[data-search-results]');
    var status = app.querySelector('[data-search-status]');
    var params = new URLSearchParams(window.location.search);
    if (input && params.get('q')) {
      input.value = params.get('q');
    }

    function movieCard(movie) {
      return [
        '<article class="movie-card" data-movie-card data-title="' + escapeHtml(movie.title) + '" data-type="' + escapeHtml(movie.type) + '" data-year="' + escapeHtml(movie.year) + '" data-region="' + escapeHtml(movie.region) + '" data-genre="' + escapeHtml(movie.genre) + '">',
        '  <a class="poster-wrap" href="' + escapeHtml(movie.href) + '">',
        '    <span class="card-badge">' + escapeHtml(movie.type) + '</span>',
        '    <img src="' + escapeHtml(movie.cover) + '" alt="' + escapeHtml(movie.title) + '" loading="lazy" data-cover>',
        '  </a>',
        '  <div class="movie-body">',
        '    <h3 class="movie-title"><a href="' + escapeHtml(movie.href) + '">' + escapeHtml(movie.title) + '</a></h3>',
        '    <p class="movie-desc">' + escapeHtml(movie.oneLine) + '</p>',
        '    <div class="card-meta"><span>' + escapeHtml(movie.year) + '</span><span>' + escapeHtml(movie.region) + '</span><span>' + escapeHtml(movie.genre) + '</span></div>',
        '  </div>',
        '</article>'
      ].join('');
    }

    function render() {
      var q = normalizeText(input && input.value);
      var typeValue = type ? type.value : '';
      var yearValue = year ? year.value : '';
      var regionValue = region ? region.value : '';
      var data = window.MOVIES.filter(function (movie) {
        var haystack = normalizeText(movie.title + ' ' + movie.oneLine + ' ' + movie.genre + ' ' + movie.region + ' ' + movie.tags);
        if (q && haystack.indexOf(q) === -1) {
          return false;
        }
        if (typeValue && movie.type !== typeValue) {
          return false;
        }
        if (yearValue && movie.year !== yearValue) {
          return false;
        }
        if (regionValue && movie.region !== regionValue) {
          return false;
        }
        return true;
      }).slice(0, 120);

      if (status) {
        status.textContent = q || typeValue || yearValue || regionValue ? '已匹配相关影片' : '输入关键词或选择条件浏览片库';
      }
      if (!results) {
        return;
      }
      if (!data.length) {
        results.innerHTML = '<div class="empty-state">没有找到相关影片</div>';
      } else {
        results.innerHTML = data.map(movieCard).join('');
        setupImageFallbacks();
      }
    }

    if (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        render();
      });
    }
    [input, type, year, region].forEach(function (control) {
      if (control) {
        control.addEventListener('input', render);
        control.addEventListener('change', render);
      }
    });
    render();
  }

  function setupPlayers() {
    selectAll('[data-video-url]').forEach(function (player) {
      var video = player.querySelector('video');
      var overlay = player.querySelector('[data-play-button]');
      var errorBox = player.querySelector('[data-player-error]');
      var url = player.getAttribute('data-video-url');
      if (!video || !url) {
        return;
      }

      function showError() {
        if (errorBox) {
          errorBox.textContent = '视频加载失败，请稍后再试';
          errorBox.classList.add('is-visible');
        }
      }

      if (window.Hls && window.Hls.isSupported()) {
        var hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.ERROR, function (eventName, data) {
          if (data && data.fatal) {
            showError();
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
      } else {
        showError();
      }

      function playVideo() {
        var promise = video.play();
        if (promise && promise.then) {
          promise.then(function () {
            player.classList.add('is-playing');
          }).catch(function () {
            showError();
          });
        } else {
          player.classList.add('is-playing');
        }
      }

      if (overlay) {
        overlay.addEventListener('click', function (event) {
          event.preventDefault();
          playVideo();
        });
      }
      video.addEventListener('play', function () {
        player.classList.add('is-playing');
      });
      video.addEventListener('ended', function () {
        player.classList.remove('is-playing');
      });
      video.addEventListener('error', showError);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupMenu();
    setupTopSearch();
    setupHero();
    setupImageFallbacks();
    setupLocalFilters();
    setupSearchPage();
    setupPlayers();
  });
})();
