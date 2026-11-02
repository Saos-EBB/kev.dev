// The page's two looks: white on cherry, or baby blue on white with a cherry
// accent. Read at load (the page's head sets data-ai-theme on <html> already),
// switched in place: the CSS follows the attribute, the scenes follow onTheme.
import { spillSwitch } from "../theme/spill";

const KEY = "kev-ai-theme";
const read = () => {
  try { return localStorage.getItem(KEY); } catch { return null; }
};
export let THEME: "white" | "red" = read() === "white" ? "white" : "red";

export const PALETTE = { bg: 0, ink: 0, accent: 0, inkCss: "", inkRgb: "" };
const fill = () => {
  const white = THEME === "white";
  Object.assign(PALETTE, {
    bg: white ? 0xffffff : 0x5c0f1f,
    ink: white ? 0x1683d6 : 0xffffff, // lines; on white a saturated blue, stronger than the paint
    accent: white ? 0x5c0f1f : 0x89cff0,
    inkCss: white ? "#89cff0" : "#ffffff",
    inkRgb: white ? "137, 207, 240" : "255, 255, 255",
  });
};
fill();

const listeners: (() => void)[] = [];
export const onTheme = (fn: () => void) => { listeners.push(fn); };

export function switchTheme() {
  THEME = THEME === "white" ? "red" : "white";
  try { localStorage.setItem(KEY, THEME); } catch { /* only for this visit then */ }
  const apply = () => {
    fill();
    if (THEME === "white") document.documentElement.dataset.aiTheme = "white";
    else delete document.documentElement.dataset.aiTheme;
    for (const fn of listeners) fn();
  };
  // The new colors spill in from the top left, like on the main page (theme.ts).
  spillSwitch(apply, THEME === "white" ? "#ffffff" : "#5c0f1f", true);
}
