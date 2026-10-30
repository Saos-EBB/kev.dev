// Hinter dir — everything else that walks, hops, slides or swims at you, for
// the arena test bench. Each monster maps the game's clip names (Walk, Run,
// Punch, HitReact, Death, Idle) to its own; what it lacks is faked in code
// (`fake`: hopping, sliding, floating, waddling), and without a death clip it
// tips over. Models: public/horror/monsters/, see NOTICE.md.

export type MonsterId =
  | "hazmat" | "forest" | "golem" | "cathuman" | "cat" | "horror" | "fatty" | "raptor"
  | "girl" | "pinguin" | "piranha" | "cactus" | "baldhead" | "rootedhead" | "sofa";
export type Clip = "Walk" | "Run" | "Punch" | "HitReact" | "Death" | "Idle";
export type Fake = "hop" | "slide" | "fly" | "waddle";

export type MonsterSpec = {
  file: string; name: string;
  height: number; // m, the model is scaled to this
  hp: number; speed: [number, number]; dmg: number;
  clips: Partial<Record<Clip, string>>;
  fake?: Fake;
  turn?: number; // yaw (rad) so the model faces +z, where the game expects the front
  walkRate?: number; // how fast the walk clip plays
};

export const MONSTERS: Record<MonsterId, MonsterSpec> = {
  hazmat: { file: "m_hazmat", name: "Gasmaske", height: 1.85, hp: 120, speed: [1.2, 2.0], dmg: 12, clips: { Walk: "zombie_forward", Run: "zombie_waddle", Punch: "zombie_fight", HitReact: "zombie_pain", Death: "zombie_death", Idle: "zombie_idle" } },
  forest: { file: "m_forest", name: "Waldmonster", height: 2.6, hp: 400, speed: [1.0, 1.4], dmg: 25, clips: { Walk: "Walk", Punch: "Attack", Death: "Dying", Idle: "Idle" } },
  golem: { file: "m_golem", name: "Golem", height: 2.8, hp: 700, speed: [0.7, 0.9], dmg: 35, clips: { Walk: "walk", Punch: "smash", Idle: "idle" } },
  cathuman: { file: "m_cathuman", name: "Katzenmensch", height: 1.8, hp: 80, speed: [3.2, 4.2], dmg: 10, clips: { Walk: "run", Idle: "idle" } },
  cat: { file: "m_cat", name: "Katze", height: 0.35, hp: 30, speed: [3.5, 4.5], dmg: 6, clips: { Walk: "KeyAction" }, fake: "hop" },
  horror: { file: "m_horror", name: "Kettenfinger", height: 2.3, hp: 260, speed: [1.1, 1.5], dmg: 20, clips: {}, fake: "waddle" },
  fatty: { file: "m_fatty", name: "Fatty", height: 2.1, hp: 320, speed: [0.9, 1.2], dmg: 22, clips: {}, fake: "waddle" },
  raptor: { file: "m_raptor", name: "Raptor", height: 1.3, hp: 90, speed: [3.8, 4.8], dmg: 14, clips: {}, fake: "hop", turn: Math.PI },
  girl: { file: "m_girl", name: "Greifmädchen", height: 1.7, hp: 70, speed: [1.6, 2.2], dmg: 10, clips: { Walk: "Walk" } },
  pinguin: { file: "m_pinguin", name: "Pinguin", height: 0.8, hp: 40, speed: [2.4, 3.2], dmg: 8, clips: {}, fake: "slide" },
  piranha: { file: "m_piranha", name: "Piranha", height: 0.5, hp: 30, speed: [2.8, 3.6], dmg: 8, clips: {}, fake: "fly", turn: -Math.PI / 2 },
  cactus: { file: "m_cactus", name: "Kaktus", height: 1.6, hp: 140, speed: [1.4, 1.8], dmg: 15, clips: {}, fake: "hop" },
  baldhead: { file: "m_baldhead", name: "Kopf", height: 0.6, hp: 60, speed: [2.0, 2.6], dmg: 10, clips: {}, fake: "hop" },
  rootedhead: { file: "m_rootedhead", name: "Wurzelkopf", height: 1.3, hp: 220, speed: [0.8, 1.0], dmg: 18, clips: {}, fake: "slide" },
  sofa: { file: "m_sofa", name: "Fleischsofa", height: 1.0, hp: 260, speed: [1.0, 1.3], dmg: 18, clips: {}, fake: "slide" },
};
export const MONSTER_IDS = Object.keys(MONSTERS) as MonsterId[];
