// The pages' own scrollbar, in place of the hidden native one, as on the main
// page: reads the position of whatever scrolls right now and writes it back
// only while the dot is dragged. Wheel, touch and keys stay native.
export function createPageScrollbar(track: HTMLElement, active: () => HTMLElement | null) {
  const thumb = track.firstElementChild as HTMLElement;

  function render() {
    const el = active();
    const limit = el ? el.scrollHeight - el.clientHeight : 0;
    track.hidden = limit <= 1;
    if (track.hidden) return;
    const travel = track.clientHeight - thumb.offsetHeight;
    thumb.style.transform = `translateY(${(el!.scrollTop / limit) * travel}px)`;
  }

  function seek(clientY: number) {
    const el = active();
    if (!el) return;
    const rect = track.getBoundingClientRect();
    const y = clientY - rect.top - thumb.offsetHeight / 2;
    const k = Math.min(1, Math.max(0, y / (rect.height - thumb.offsetHeight)));
    el.scrollTo({ top: k * (el.scrollHeight - el.clientHeight), behavior: "instant" });
  }

  let dragging = false;
  track.addEventListener("pointerdown", (e) => {
    e.stopPropagation(); // or the skull's stage takes the pointer for itself
    e.preventDefault(); // no text selection on the way
    dragging = true;
    seek(e.clientY);
  });
  window.addEventListener("pointermove", (e) => {
    if (dragging) seek(e.clientY);
  });
  window.addEventListener("pointerup", () => {
    dragging = false;
  });
  window.addEventListener("resize", render, { passive: true });
  return { render };
}
