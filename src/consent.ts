// Consents for the two features that load from third parties, each only
// after the visitor agrees in a notice right where the feature is:
//   youtube — the header music player (music/youtube.ts)
//   cheerpj — the Java runtime of the Grundlagen live demo
//             (projects/widgets/grundlagen.ts)
// Remembered in this browser (localStorage); the privacy policy has a
// section to withdraw them (legal/legal-overlay.ts). Clearing the site's
// data withdraws them too.

export type ConsentId = "youtube" | "cheerpj";

const KEYS: Record<ConsentId, string> = {
  youtube: "kev-yt-consent",
  cheerpj: "kev-cheerpj-consent",
};

export function hasConsent(id: ConsentId): boolean {
  try {
    return localStorage.getItem(KEYS[id]) === "1";
  } catch {
    return false;
  }
}

export function grantConsent(id: ConsentId) {
  try {
    localStorage.setItem(KEYS[id], "1");
  } catch {
    // storage blocked — the notice just shows again next time
  }
}

export function revokeConsent(id: ConsentId) {
  try {
    localStorage.removeItem(KEYS[id]);
  } catch {
    // storage blocked — nothing was stored either
  }
}
