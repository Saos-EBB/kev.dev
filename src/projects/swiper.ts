// Lite mode (phones / narrow tablets, see LITE in viewport.ts): the
// projects are a native horizontal scroll-snap gallery instead of the
// pinned, scroll-scrubbed carousel. The browser does all the moving —
// swipe, momentum and snapping run on the compositor, nothing here runs
// per frame. This file only keeps the dots/arrows in sync with which card
// is in view and lets them jump to a card.

export function initProjectSwiper(section: HTMLElement) {
  const stage = section.querySelector<HTMLElement>(".carousel-stage");
  const slides = Array.from(
    section.querySelectorAll<HTMLElement>(".carousel-project"),
  );
  const dots = Array.from(
    section.querySelectorAll<HTMLButtonElement>(".swiper-dots button"),
  );
  const arrows = Array.from(
    section.querySelectorAll<HTMLButtonElement>(".swiper-arrow"),
  );
  if (!stage || slides.length === 0) return;

  let current = 0;

  const render = () => {
    dots.forEach((dot, i) => {
      if (i === current) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
    });
    arrows.forEach((arrow) => {
      const dir = Number(arrow.dataset.dir);
      arrow.disabled = current + dir < 0 || current + dir >= slides.length;
    });
    slides.forEach((slide, i) => slide.classList.toggle("is-current", i === current));
  };

  // The slide covering the stage's center is the current one.
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          current = slides.indexOf(entry.target as HTMLElement);
          render();
        }
      }
    },
    { root: stage, rootMargin: "0px -50% 0px -50%" },
  );
  slides.forEach((slide) => io.observe(slide));

  const goTo = (i: number) => {
    const slide = slides[Math.max(0, Math.min(slides.length - 1, i))];
    // scrollIntoView rather than computing scrollLeft: on the RTL (Arabic)
    // page scrollLeft runs negative, this handles both directions.
    slide.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  };

  dots.forEach((dot) =>
    dot.addEventListener("click", () => goTo(Number(dot.dataset.goto))),
  );
  arrows.forEach((arrow) =>
    arrow.addEventListener("click", () => goTo(current + Number(arrow.dataset.dir))),
  );

  render();
}
