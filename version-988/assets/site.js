const menuButton = document.querySelector(".menu-toggle");
const mobilePanel = document.querySelector(".mobile-panel");

if (menuButton && mobilePanel) {
  menuButton.addEventListener("click", () => {
    const expanded = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!expanded));
    mobilePanel.hidden = expanded;
  });
}

const slides = Array.from(document.querySelectorAll("[data-hero-slide]"));
const dots = Array.from(document.querySelectorAll("[data-hero-dot]"));
let heroIndex = 0;
let heroTimer = null;

function showHero(index) {
  if (!slides.length) {
    return;
  }
  heroIndex = (index + slides.length) % slides.length;
  slides.forEach((slide, i) => slide.classList.toggle("is-active", i === heroIndex));
  dots.forEach((dot, i) => dot.classList.toggle("is-active", i === heroIndex));
}

function runHero() {
  if (slides.length < 2) {
    return;
  }
  clearInterval(heroTimer);
  heroTimer = setInterval(() => showHero(heroIndex + 1), 5200);
}

dots.forEach((dot, index) => {
  dot.addEventListener("click", () => {
    showHero(index);
    runHero();
  });
});

runHero();

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function setupFilters() {
  const box = document.querySelector("[data-filter-box]");
  const container = document.querySelector("[data-card-container]");
  if (!box || !container) {
    return;
  }

  const input = box.querySelector("[data-filter-input]");
  const type = box.querySelector("[data-filter-type]");
  const region = box.querySelector("[data-filter-region]");
  const empty = document.querySelector("[data-empty-state]");
  const cards = Array.from(container.querySelectorAll("[data-search]"));
  const query = new URLSearchParams(location.search).get("q");

  if (query && input) {
    input.value = query;
  }

  function apply() {
    const q = normalize(input ? input.value : "");
    const typeValue = type ? type.value : "";
    const regionValue = region ? region.value : "";
    let shown = 0;

    cards.forEach((card) => {
      const text = normalize(card.getAttribute("data-search"));
      const sameType = !typeValue || card.getAttribute("data-type") === typeValue;
      const sameRegion = !regionValue || card.getAttribute("data-region") === regionValue;
      const matched = (!q || text.includes(q)) && sameType && sameRegion;
      card.hidden = !matched;
      if (matched) {
        shown += 1;
      }
    });

    if (empty) {
      empty.hidden = shown !== 0;
    }
  }

  [input, type, region].forEach((item) => {
    if (item) {
      item.addEventListener("input", apply);
      item.addEventListener("change", apply);
    }
  });

  apply();
}

setupFilters();
