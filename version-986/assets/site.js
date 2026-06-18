(function () {
    function ready(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    }

    function normalize(value) {
        return (value || '').toString().trim().toLowerCase();
    }

    function initMenu() {
        var toggle = document.querySelector('.menu-toggle');
        if (!toggle) {
            return;
        }
        toggle.addEventListener('click', function () {
            document.body.classList.toggle('menu-open');
        });
        document.querySelectorAll('.mobile-link').forEach(function (link) {
            link.addEventListener('click', function () {
                document.body.classList.remove('menu-open');
            });
        });
    }

    function initHero() {
        var root = document.querySelector('[data-hero]');
        if (!root) {
            return;
        }
        var slides = Array.prototype.slice.call(root.querySelectorAll('.hero-slide'));
        var dots = Array.prototype.slice.call(root.querySelectorAll('.hero-dot'));
        var picks = Array.prototype.slice.call(root.querySelectorAll('[data-slide-link]'));
        var index = 0;
        var timer = null;

        function show(next) {
            if (!slides.length) {
                return;
            }
            index = (next + slides.length) % slides.length;
            slides.forEach(function (slide, i) {
                slide.classList.toggle('active', i === index);
            });
            dots.forEach(function (dot, i) {
                dot.classList.toggle('active', i === index);
            });
            picks.forEach(function (pick, i) {
                pick.classList.toggle('active', i === index);
            });
        }

        function play() {
            timer = window.setInterval(function () {
                show(index + 1);
            }, 5200);
        }

        dots.forEach(function (dot) {
            dot.addEventListener('click', function () {
                window.clearInterval(timer);
                show(Number(dot.getAttribute('data-slide') || 0));
                play();
            });
        });
        picks.forEach(function (pick) {
            pick.addEventListener('mouseenter', function () {
                show(Number(pick.getAttribute('data-slide-link') || 0));
            });
        });
        show(0);
        play();
    }

    function initFilters() {
        var scope = document.querySelector('[data-filter-scope]');
        if (!scope) {
            return;
        }
        var input = document.querySelector('[data-filter-input]');
        var year = document.querySelector('[data-year-filter]');
        var type = document.querySelector('[data-type-filter]');
        var cards = Array.prototype.slice.call(scope.querySelectorAll('[data-movie-card]'));
        var params = new URLSearchParams(window.location.search);
        var initial = params.get('q') || '';
        var pageInput = document.querySelector('[data-search-page-input]');
        if (pageInput) {
            pageInput.value = initial;
        }
        if (input && initial) {
            input.value = initial;
        }

        function apply() {
            var q = normalize(input ? input.value : '');
            var y = normalize(year ? year.value : '');
            var t = normalize(type ? type.value : '');
            cards.forEach(function (card) {
                var haystack = normalize([
                    card.getAttribute('data-title'),
                    card.getAttribute('data-year'),
                    card.getAttribute('data-type'),
                    card.getAttribute('data-region'),
                    card.getAttribute('data-category'),
                    card.getAttribute('data-genre')
                ].join(' '));
                var matchQ = !q || haystack.indexOf(q) !== -1;
                var matchYear = !y || normalize(card.getAttribute('data-year')) === y;
                var matchType = !t || normalize(card.getAttribute('data-type')).indexOf(t) !== -1;
                card.classList.toggle('is-hidden', !(matchQ && matchYear && matchType));
            });
        }

        [input, year, type].forEach(function (el) {
            if (el) {
                el.addEventListener('input', apply);
                el.addEventListener('change', apply);
            }
        });
        apply();
    }

    window.initMoviePlayer = function (src) {
        var video = document.getElementById('moviePlayer');
        var button = document.getElementById('playerStart');
        if (!video || !src) {
            return;
        }
        var attached = false;
        var hlsInstance = null;

        function attach() {
            if (attached) {
                return;
            }
            attached = true;
            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = src;
            } else if (window.Hls && window.Hls.isSupported()) {
                hlsInstance = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true,
                    backBufferLength: 90
                });
                hlsInstance.loadSource(src);
                hlsInstance.attachMedia(video);
            } else {
                video.src = src;
            }
        }

        function start() {
            attach();
            if (button) {
                button.classList.add('is-hidden');
            }
            var promise = video.play();
            if (promise && promise.catch) {
                promise.catch(function () {});
            }
        }

        if (button) {
            button.addEventListener('click', start);
        }
        video.addEventListener('click', function () {
            if (video.paused) {
                start();
            }
        });
        video.addEventListener('play', function () {
            if (button) {
                button.classList.add('is-hidden');
            }
        });
        window.addEventListener('beforeunload', function () {
            if (hlsInstance && hlsInstance.destroy) {
                hlsInstance.destroy();
            }
        });
    };

    ready(function () {
        initMenu();
        initHero();
        initFilters();
    });
})();
