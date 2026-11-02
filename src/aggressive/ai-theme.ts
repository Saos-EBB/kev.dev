// The page's two looks: white on cherry, or baby blue on white with a cherry
// accent. Decided once at load, like the language: the scenes take their colors
// when they're built. The value is set on <html> by the page's head already.
const KEY = "kev-ai-theme";
const read = () => {
  try { return localStorage.getItem(KEY); } catch { return null; }
};
export const THEME = read() === "white" ? "white" : "red";
const WHITE = THEME === "white";

export const PALETTE = {
  bg: WHITE ? 0xffffff : 0x5c0f1f,
  ink: WHITE ? 0x1f7ab8 : 0xffffff, // lines; on white a stronger blue than the paint
  accent: WHITE ? 0x5c0f1f : 0x89cff0,
  inkCss: WHITE ? "#89cff0" : "#ffffff",
  inkRgb: WHITE ? "137, 207, 240" : "255, 255, 255",
};

export function switchTheme() {
  try { localStorage.setItem(KEY, WHITE ? "red" : "white"); } catch { /* stays as it is */ }
  location.reload();
}
