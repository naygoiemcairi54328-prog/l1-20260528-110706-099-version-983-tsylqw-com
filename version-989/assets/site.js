(function() {
    var menuButton = document.querySelector('[data-menu-toggle]');
    var mobileNav = document.querySelector('[data-mobile-nav]');

    if (menuButton && mobileNav) {
        menuButton.addEventListener('click', function() {
            mobileNav.classList.toggle('open');
        });
    }

    var slides = Array.prototype.slice.call(document.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(document.querySelectorAll('[data-hero-dot]'));
    var currentSlide = 0;

    function showSlide(index) {
        if (!slides.length) {
            return;
        }

        currentSlide = (index + slides.length) % slides.length;

        slides.forEach(function(slide, slideIndex) {
            slide.classList.toggle('active', slideIndex === currentSlide);
        });

        dots.forEach(function(dot, dotIndex) {
            dot.classList.toggle('active', dotIndex === currentSlide);
        });
    }

    dots.forEach(function(dot, dotIndex) {
        dot.addEventListener('click', function() {
            showSlide(dotIndex);
        });
    });

    if (slides.length > 1) {
        showSlide(0);
        setInterval(function() {
            showSlide(currentSlide + 1);
        }, 5600);
    }

    var filterAreas = Array.prototype.slice.call(document.querySelectorAll('[data-filter-area]'));

    filterAreas.forEach(function(area) {
        var textInput = area.querySelector('[data-filter-input]');
        var yearSelect = area.querySelector('[data-year-filter]');
        var categorySelect = area.querySelector('[data-category-filter]');
        var scope = area.parentElement || document;
        var cards = Array.prototype.slice.call(scope.querySelectorAll('.movie-card, .rank-item'));

        function applyFilter() {
            var query = textInput ? textInput.value.trim().toLowerCase() : '';
            var year = yearSelect ? yearSelect.value : 'all';
            var category = categorySelect ? categorySelect.value : 'all';

            cards.forEach(function(card) {
                var text = ((card.getAttribute('data-title') || '') + ' ' + (card.getAttribute('data-keywords') || '')).toLowerCase();
                var cardYear = card.getAttribute('data-year') || '';
                var cardCategory = card.getAttribute('data-category') || '';
                var matchedText = !query || text.indexOf(query) !== -1;
                var matchedYear = year === 'all' || cardYear === year;
                var matchedCategory = category === 'all' || cardCategory === category;
                card.classList.toggle('hidden-card', !(matchedText && matchedYear && matchedCategory));
            });
        }

        if (textInput) {
            textInput.addEventListener('input', applyFilter);
        }

        if (yearSelect) {
            yearSelect.addEventListener('change', applyFilter);
        }

        if (categorySelect) {
            categorySelect.addEventListener('change', applyFilter);
        }
    });
})();

function initMoviePlayer(playUrl) {
    var video = document.getElementById('movieVideo');
    var cover = document.querySelector('[data-player-cover]');
    var button = document.querySelector('[data-play-button]');
    var prepared = false;
    var hlsInstance = null;

    if (!video || !playUrl) {
        return;
    }

    function tryPlay() {
        video.controls = true;
        var action = video.play();

        if (action && typeof action.catch === 'function') {
            action.catch(function() {});
        }
    }

    function prepare() {
        if (prepared) {
            return;
        }

        prepared = true;

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = playUrl;
            video.load();
            return;
        }

        if (window.Hls && window.Hls.isSupported()) {
            hlsInstance = new window.Hls({
                enableWorker: true,
                lowLatencyMode: true
            });
            hlsInstance.loadSource(playUrl);
            hlsInstance.attachMedia(video);
            hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function() {
                tryPlay();
            });
            return;
        }

        video.src = playUrl;
        video.load();
    }

    function start() {
        prepare();

        if (cover) {
            cover.classList.add('is-hidden');
        }

        tryPlay();
    }

    if (button) {
        button.addEventListener('click', start);
    }

    if (cover) {
        cover.addEventListener('click', start);
    }

    video.addEventListener('click', function() {
        if (video.paused) {
            start();
        }
    });

    window.addEventListener('pagehide', function() {
        if (hlsInstance) {
            hlsInstance.destroy();
            hlsInstance = null;
        }
    });
}
