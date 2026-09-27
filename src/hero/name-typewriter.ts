// Types each name from hero-names.ts into `el` letter by letter,
// holds it, backspaces it out, then moves on to the next one — looping
// forever through the list. `el`'s font-size is fixed by the caller
// (sized to the longest name in the rotation, see fitHeroName() in
// main.ts) so only the text content changes here; onTextChange is the
// hook that re-rasterizes it onto the cloth's texture.
import { HERO_NAMES } from "./hero-names";
import { TIMINGS } from "../timings";

export function startNameTypewriter(
  el: HTMLElement,
  onTextChange: () => void,
): () => void {
  const names = HERO_NAMES.length > 0 ? HERO_NAMES : [el.textContent ?? ""];
  const { typeMs, deleteMs, holdMs, pauseMs } = TIMINGS.heroName;

  let nameIndex = 0;
  let timer: ReturnType<typeof setTimeout>;
  let stopped = false;

  function setText(text: string) {
    el.textContent = text;
    onTextChange();
  }

  function typeName() {
    const name = names[nameIndex];
    let i = 0;
    const step = () => {
      if (stopped) return;
      i++;
      setText(name.slice(0, i));
      timer = setTimeout(i < name.length ? step : deleteName, i < name.length ? typeMs : holdMs);
    };
    step();
  }

  function deleteName() {
    const name = names[nameIndex];
    let i = name.length;
    const step = () => {
      if (stopped) return;
      i--;
      setText(name.slice(0, i));
      if (i > 0) {
        timer = setTimeout(step, deleteMs);
      } else {
        nameIndex = (nameIndex + 1) % names.length;
        timer = setTimeout(typeName, pauseMs);
      }
    };
    step();
  }

  // Starts from empty — el arrives with the first name already in it
  // (see the hero-name markup/fallback in main.ts), so clear it before
  // typing the same name back in rather than jump-cutting straight from
  // full text to one letter.
  setText("");
  typeName();

  return () => {
    stopped = true;
    clearTimeout(timer);
  };
}
