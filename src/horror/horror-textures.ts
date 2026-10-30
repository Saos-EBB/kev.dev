import * as THREE from "three";

// Generated from the export (see horror-arsenal.ts / horror-bestiary.ts): textures the glTF
// exporter dropped, saved as <file>__<material>.jpg next to the model. Material names
// as in the model, with anything but [A-Za-z0-9_.-] turned into _.
export const LOOSE_TEXTURES: Record<string, string[]> = {
  m_cactus: ["MobileCactus"],
  m_forest: ["Monster", "Tree"],
  m_girl: ["Character"],
  m_golem: ["golem_mat"],
  m_pinguin: ["Material.009"],
  m_piranha: ["piranha_mtl"],
  m_raptor: ["Claws", "Dromaeosaur", "Eye", "Ground", "Teeth"],
  w_flamer: ["Flamethrower"],
  w_mace: ["Material"],
  w_sniper1a: ["Body", "Lens"],
  w_sword: ["Material.000"],
};

const texLoader = new THREE.TextureLoader();
const safe = (s: string) => s.replace(/[^A-Za-z0-9_.-]/g, "_");
/** Put the loose textures of model `file` (in /horror/<dir>/) on its materials, by name. */
export async function applyLooseTextures(root: THREE.Object3D, file: string, dir: "monsters" | "weapons") {
  const mats = LOOSE_TEXTURES[file];
  if (!mats) return;
  const maps = new Map(await Promise.all(mats.map(async (m) => {
    const t = await texLoader.loadAsync(`/horror/${dir}/${file}__${m}.jpg`).catch(() => null);
    if (t) { t.colorSpace = THREE.SRGBColorSpace; t.flipY = false; } // glTF UVs
    return [m, t] as const;
  })));
  root.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    for (const m of (Array.isArray(o.material) ? o.material : [o.material]) as THREE.MeshStandardMaterial[]) {
      const t = maps.get(safe(m.name));
      if (t) { m.map = t; m.color.set(0xffffff); m.metalness = Math.min(m.metalness, 0.2); m.needsUpdate = true; }
    }
  });
}
