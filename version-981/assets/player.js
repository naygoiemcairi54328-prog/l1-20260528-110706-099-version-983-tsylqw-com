(function () {
  function initMoviePlayer(source) {
    var video = document.getElementById("movie-player");
    var trigger = document.getElementById("player-trigger");
    var hlsReady = false;

    if (!video || !source) {
      return;
    }

    function attachSource() {
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        if (video.getAttribute("src") !== source) {
          video.setAttribute("src", source);
        }
        return;
      }

      if (window.Hls && window.Hls.isSupported()) {
        if (!hlsReady) {
          var hls = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90
          });
          hls.loadSource(source);
          hls.attachMedia(video);
          hlsReady = true;
        }
        return;
      }

      if (video.getAttribute("src") !== source) {
        video.setAttribute("src", source);
      }
    }

    function startPlayback() {
      attachSource();

      if (trigger) {
        trigger.classList.add("is-hidden");
      }

      var playback = video.play();

      if (playback && playback.catch) {
        playback.catch(function () {});
      }
    }

    if (trigger) {
      trigger.addEventListener("click", startPlayback);
    }

    video.addEventListener("click", function () {
      if (video.paused) {
        startPlayback();
      }
    });

    video.addEventListener("play", function () {
      if (trigger) {
        trigger.classList.add("is-hidden");
      }
    });
  }

  window.initMoviePlayer = initMoviePlayer;
})();
