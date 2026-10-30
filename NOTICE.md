# Third-party notices

kev.dev itself is "All rights reserved" (see `LICENSE`). The parts below are
**not mine**. Each one stays under its own license.

## Libraries (npm, bundled into the site)

| Package | License |
|---|---|
| `@mediapipe/tasks-vision` (incl. the wasm files it ships) | Apache-2.0, © Google LLC |
| `gsap` | GSAP Standard "No Charge" License, © GreenSock / Webflow |
| `lenis`, `react`, `react-dom`, `zustand`, `lucide-react`, `leo-profanity`, `three` | MIT |
| `@fontsource/caveat-brush` | OFL-1.1 (font) / MIT (package) |
| `@fontsource-variable/jetbrains-mono` | OFL-1.1 (font) / MIT (package) |

Full license texts ship with each package in `node_modules/<package>/`.

## Models

- MediaPipe Selfie Multiclass segmentation model
  (`selfie_multiclass_256x256.tflite`), © Google LLC, Apache License 2.0
  (https://www.apache.org/licenses/LICENSE-2.0). Not stored here: the
  FaceDots tool loads it unmodified from Google's model storage, only
  after the visitor consents.
- `src/projects/widgets/renderer-models/` (ducky, car, pochita30,
  craniumCut01): 3D models converted for the renderer widget. All of them
  are CC0 / public domain models from their respective authors.
  Pochita is a fan model of a character from *Chainsaw Man*
  (© Tatsuki Fujimoto / Shueisha); the character itself belongs to its
  rights holders.

- `public/horror/head.glb` (hidden page `/saos#dev#horror`): "Lee Perry-Smith"
  3D head scan by Infinite-Realities, CC BY 3.0
  (https://creativecommons.org/licenses/by/3.0/), based on a work at
  www.triplegangers.com; taken from the three.js examples. Material
  replaced in code.
- `public/horror/face.glb` (same page): `facecap.glb` from the three.js
  examples, model by Face Cap (https://www.bannaflak.com/face-cap). The
  three.js example states no separate license for it.

- `public/horror/zombie_basic.glb`, `zombie_chubby.glb`,
  `shotgun.glb`, `bat_saw.glb`, `rifle.glb`, `smg.glb` (same page): from the "Zombie Apocalypse Kit" by Quaternius
  (https://quaternius.com/packs/zombieapocalypsekit.html), CC0 1.0
  (https://creativecommons.org/publicdomain/zero/1.0/). Converted from glTF to
  GLB, otherwise unchanged; colors darkened or tinted in code.

- `public/horror/weapons/fps_*.glb` (same page): the "FPS Pack" (pistol, P90,
  revolver, rifle, shotgun, sniper rifle, with fire/reload animations), CC0 1.0
  per its download page. Exported from the .blend files to GLB; recoloured in
  code. Source URL: TODO.
- `public/horror/weapons/saber_arms.glb`, `saber.jpg` (same page): "Animated
  Pirate Sword" (arms + sabre with draw/idle/slash/pierce), CC0 1.0 per its
  download page. Exported to GLB, texture scaled to 512 px; the arms' texture
  wasn't included, they're coloured in code. Source URL: TODO.

- Arena test bench (same page): `public/horror/weapons/w_*.glb` and
  `public/horror/monsters/m_*.glb`, with loose `*__*.jpg` textures beside them.
  All downloaded as CC0 1.0; exported from .blend/.fbx/.obj/.glb to GLB,
  heavy ones decimated, textures scaled to 512 px, colours adjusted in code.
  Authors where the download named them:
  "Forest Monster" by Čestmír Dammer (CDmir, kelgar.org); "PSX Body Horror
  Props" (BaldZombieHead, RootedHorrorHead, FleshSofa) by PSXgraphics /
  Flipperside; "The Mobile Cactus" by Mophs (OpenGameArt, after Winternaut);
  penguin by Phelippeau Rudy (STKudy85); "Fatty" by Drummyfish
  (https://opengameart.org/content/fatty). Source URLs for the rest
  (weapons, hazmat, golem, cat-human, cat, chain-finger monster, raptor,
  grapple girl, piranha): TODO.

## Fonts

| File | Font | License |
|---|---|---|
| `public/fonts/urban-sign.woff` | Urban Sign (Anggi Hermawan / Forberas Type Foundry), converted from OTF to WOFF | Free for personal use (commercial license at creativemarket.com/forberas); used non-commercially on this personal portfolio, not redistributed for other use |
| `public/fonts/ui/*` | Space Grotesk, Source Serif 4, Courier Prime, JetBrains Mono | SIL Open Font License 1.1 |
| `public/favicon.svg`, `public/apple-touch-icon.png` | "kev" glyph outlines from Don Graffiti (Juan Miguel Castillo / Don Marciano), converted to SVG paths | Freeware — designer: "If the License is 'Free' do what ever you want with it, even for commercial use" (fontspace.com/don-graffiti-font-f31465) |

## Images and sounds

| File | License |
|---|---|
| `public/images/raygun.png`, `laser_gun.png`, `social-mail.png`, `social-phone.png` | CC0 |
| `public/images/social-github.svg` | GitHub logo, trademark of GitHub, Inc., used only as a link icon |
| `public/sounds/railgun.mp3` | CC0 |

## Services

- **CheerpJ** (Java in the browser, `grundlagen` widget): loaded from the
  official Leaning Technologies CDN under the CheerpJ Community License
  (free for personal projects, with credit). Credit: CheerpJ by Leaning
  Technologies, https://cheerpj.com.
