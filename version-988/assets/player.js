(function () {
  async function resolveHls() {
    if (window.Hls) {
      return window.Hls;
    }

    try {
      const module = await import("./hls-vendor.js");
      return module.H;
    } catch (error) {
      return null;
    }
  }

  window.bootPlayer = function bootPlayer(source, videoId, layerId) {
    const video = document.getElementById(videoId);
    const layer = document.getElementById(layerId);
    let loaded = false;
    let hls = null;

    if (!video || !layer || !source) {
      return;
    }

    async function load() {
      if (loaded) {
        return;
      }

      loaded = true;

      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = source;
        return;
      }

      const HlsClass = await resolveHls();
      if (HlsClass && HlsClass.isSupported()) {
        hls = new HlsClass({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(source);
        hls.attachMedia(video);
        return;
      }

      video.src = source;
    }

    async function start() {
      await load();
      layer.classList.add("is-hidden");
      video.controls = true;
      const playing = video.play();
      if (playing && typeof playing.catch === "function") {
        playing.catch(() => {
          layer.classList.remove("is-hidden");
        });
      }
    }

    layer.addEventListener("click", start);
    video.addEventListener("click", () => {
      if (video.paused) {
        start();
      }
    });
    video.addEventListener("playing", () => {
      layer.classList.add("is-hidden");
    });
    video.addEventListener("error", () => {
      if (!hls && !video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = source;
      }
    });
  };
})();
