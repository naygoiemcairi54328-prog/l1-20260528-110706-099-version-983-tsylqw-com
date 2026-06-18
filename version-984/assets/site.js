(function () {
  var searchCache = null;

  function ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function debounce(fn, delay) {
    var timer = null;
    return function () {
      var args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () {
        fn.apply(null, args);
      }, delay);
    };
  }

  function setupMenu() {
    var button = qs('[data-menu-toggle]');
    var nav = qs('[data-mobile-nav]');
    if (!button || !nav) return;
    button.addEventListener('click', function () {
      nav.classList.toggle('is-open');
    });
  }

  function setupHero() {
    var slider = qs('[data-hero-slider]');
    if (!slider) return;
    var slides = qsa('.hero-slide', slider);
    var dots = qsa('[data-slide-target]', slider);
    if (!slides.length) return;
    var current = 0;

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === current);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === current);
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-slide-target') || 0));
      });
    });

    setInterval(function () {
      show(current + 1);
    }, 5200);
  }

  function setupPageFilter() {
    var input = qs('.js-page-filter');
    var list = qs('[data-filter-list]');
    var count = qs('.js-filter-count');
    if (!input || !list) return;
    var cards = qsa('[data-search]', list);

    input.addEventListener('input', function () {
      var term = input.value.trim().toLowerCase();
      var visible = 0;
      cards.forEach(function (card) {
        var text = card.getAttribute('data-search') || card.textContent || '';
        var matched = !term || text.toLowerCase().indexOf(term) !== -1;
        card.classList.toggle('is-filtered-out', !matched);
        if (matched) visible += 1;
      });
      if (count) count.textContent = String(visible);
    });
  }

  function loadSearchIndex() {
    if (searchCache) return Promise.resolve(searchCache);
    return fetch('./assets/search-index.json')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        searchCache = data;
        return data;
      })
      .catch(function () {
        return [];
      });
  }

  function renderSearch(panel, items, query) {
    panel.innerHTML = '';
    if (!query) {
      panel.classList.remove('is-open');
      return;
    }
    if (!items.length) {
      panel.classList.add('is-open');
      panel.innerHTML = '<div class="empty-result">没有找到匹配影片</div>';
      return;
    }
    items.slice(0, 10).forEach(function (item) {
      var link = document.createElement('a');
      link.className = 'search-result';
      link.href = item.url;
      link.innerHTML = '<img src="' + item.cover + '" alt="">' +
        '<span><strong>' + escapeHtml(item.title) + '</strong>' +
        '<small>' + escapeHtml(item.region + ' · ' + item.year + ' · ' + item.type) + '</small></span>';
      panel.appendChild(link);
    });
    panel.classList.add('is-open');
  }

  function escapeHtml(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function setupGlobalSearch() {
    var inputs = qsa('.js-global-search');
    inputs.forEach(function (input) {
      var panel = input.parentElement ? qs('.search-panel', input.parentElement) : null;
      if (!panel) return;
      var runSearch = debounce(function () {
        var query = input.value.trim().toLowerCase();
        loadSearchIndex().then(function (data) {
          var items = data.filter(function (item) {
            return item.search.indexOf(query) !== -1;
          });
          renderSearch(panel, items, query);
        });
      }, 120);
      input.addEventListener('input', runSearch);
      input.addEventListener('focus', runSearch);
      document.addEventListener('click', function (event) {
        if (!input.parentElement.contains(event.target)) {
          panel.classList.remove('is-open');
        }
      });
    });
  }

  function setupPlayers() {
    qsa('.js-player-card').forEach(function (card) {
      var video = qs('.js-player', card);
      var start = qs('.js-player-start', card);
      if (!video || !start) return;
      var src = video.getAttribute('data-src');
      var hls = null;

      function init() {
        if (video.getAttribute('data-ready') === '1') return;
        video.setAttribute('data-ready', '1');
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = src;
        } else if (window.Hls && window.Hls.isSupported()) {
          hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
          hls.loadSource(src);
          hls.attachMedia(video);
        } else {
          start.innerHTML = '<span>当前浏览器无法播放该视频</span>';
        }
      }

      function play() {
        init();
        video.controls = true;
        start.classList.add('is-hidden');
        var playPromise = video.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(function () {
            start.classList.remove('is-hidden');
          });
        }
      }

      init();
      start.addEventListener('click', play);
      video.addEventListener('click', function () {
        if (video.paused) {
          play();
        } else {
          video.pause();
        }
      });
      video.addEventListener('play', function () {
        start.classList.add('is-hidden');
      });
      video.addEventListener('pause', function () {
        if (!video.ended) start.classList.remove('is-hidden');
      });
      window.addEventListener('beforeunload', function () {
        if (hls) hls.destroy();
      });
    });
  }

  ready(function () {
    setupMenu();
    setupHero();
    setupPageFilter();
    setupGlobalSearch();
    setupPlayers();
  });
})();
