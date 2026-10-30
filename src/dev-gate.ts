// Password screen in front of every /saos#dev… page. Only the SHA-256 of the
// password ships (the repo is public); the page code loads after it matches.
// Only letters and digits count, case doesn't: keyboard layouts and autofill
// can't get in the way. It opens as soon as the input matches.
// Still a client-side gate: it keeps visitors out, not someone determined.
// Once unlocked, this browser stays unlocked (localStorage).
const HASH = "e027a136eafb084c5894219db37569fb0e30c7123586cac8d3622f4a6028bf70";
const KEY = "saos-dev-unlocked";

async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function unlocked() {
  try { return localStorage.getItem(KEY) === HASH; } catch { return false; }
}

export function devGate(): Promise<void> {
  if (unlocked()) return Promise.resolve();
  // crypto.subtle only exists on https/localhost; the dev server over the LAN (phone) is plain http
  if (!crypto.subtle) return import.meta.env.DEV ? Promise.resolve() : new Promise(() => {});

  return new Promise((resolve) => {
    const root = document.createElement("form");
    root.innerHTML = `
      <style>
        html, body { margin: 0; background: #0b0b0d; }
        .gate { position: fixed; inset: 0; display: grid; place-items: center; padding: 16px; font: 16px/1.4 system-ui, sans-serif; color: #e8e2d6; }
        .gate div { display: grid; gap: 12px; width: min(320px, 100%); }
        .gate input, .gate button { font: inherit; padding: 12px 14px; border-radius: 8px; border: 1px solid #3a3a40; background: #16161a; color: inherit; }
        .gate button { background: #e8e2d6; color: #0b0b0d; border: 0; cursor: pointer; }
        .gate p { margin: 0; min-height: 1.4em; color: #ff6b5e; font-size: 14px; }
      </style>
      <div>
        <input type="password" name="pw" placeholder="Passwort" autocomplete="off" autofocus aria-label="Passwort" />
        <button type="submit">Rein</button>
        <p role="alert"></p>
      </div>`;
    root.className = "gate";
    document.body.append(root);
    const input = root.querySelector("input")!, msg = root.querySelector("p")!;
    const norm = (v: string) => v.toLowerCase().replace(/[^a-z0-9]/g, "");
    let open = false;
    const check = async (final: boolean) => {
      if (open) return;
      if ((await sha256(norm(input.value))) !== HASH) { if (final) { msg.textContent = "Falsch."; input.select(); } return; }
      open = true;
      try { localStorage.setItem(KEY, HASH); } catch { /* private mode: ask again next time */ }
      root.remove();
      resolve();
    };
    input.addEventListener("input", () => { msg.textContent = ""; void check(false); });
    root.addEventListener("submit", (e) => { e.preventDefault(); void check(true); });
  });
}
