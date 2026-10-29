// Hinter dir — every sound is synthesized with WebAudio (no files).
// Two HRTF panners give direction: `it` sits where the thing behind you
// is, `ear` sits right behind your head (whispers).

export type Vec3 = { x: number; y: number; z: number };

let ctx: AudioContext;
let out: GainNode;
let noise: AudioBuffer;
export let it: PannerNode;
export let ear: PannerNode;
export const ready = () => ctx !== undefined;

export function init() {
  ctx = new AudioContext();
  const comp = ctx.createDynamicsCompressor();
  comp.connect(ctx.destination);
  out = ctx.createGain();
  out.gain.value = 0.9;
  out.connect(comp);

  noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const d = noise.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

  // drone: brown noise through a slowly breathing lowpass + three low sines
  const brown = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
  const b = brown.getChannelData(0);
  let l = 0;
  for (let i = 0; i < b.length; i++) { l = (l + 0.02 * (Math.random() * 2 - 1)) / 1.02; b[i] = l * 3.5; }
  const drone = ctx.createGain();
  drone.gain.value = 0.5;
  drone.connect(out);
  const bs = ctx.createBufferSource();
  bs.buffer = brown; bs.loop = true;
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass"; lp.frequency.value = 220;
  const lfo = ctx.createOscillator(), lg = ctx.createGain();
  lfo.frequency.value = 0.07; lg.gain.value = 120;
  lfo.connect(lg).connect(lp.frequency); lfo.start();
  bs.connect(lp).connect(drone); bs.start();
  [43, 64.7, 91.2].forEach((f, i) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.value = f; g.gain.value = [0.06, 0.035, 0.015][i];
    o.connect(g).connect(drone); o.start();
  });

  it = panner(1.2, 1.1);
  ear = panner(0.5, 1);
}

function panner(refDistance: number, rolloffFactor: number) {
  const p = new PannerNode(ctx, { panningModel: "HRTF", distanceModel: "inverse", refDistance, rolloffFactor });
  p.connect(out);
  return p;
}

export function setPos(p: PannerNode, v: Vec3) {
  p.positionX.value = v.x; p.positionY.value = v.y; p.positionZ.value = v.z;
}

export function setListener(pos: Vec3, fwd: Vec3) {
  const L = ctx.listener;
  if (L.positionX) {
    L.positionX.value = pos.x; L.positionY.value = pos.y; L.positionZ.value = pos.z;
    L.forwardX.value = fwd.x; L.forwardY.value = fwd.y; L.forwardZ.value = fwd.z;
    L.upX.value = 0; L.upY.value = 1; L.upZ.value = 0;
  } else {
    // Firefox: no AudioParams on the listener
    L.setPosition(pos.x, pos.y, pos.z);
    L.setOrientation(fwd.x, fwd.y, fwd.z, 0, 1, 0);
  }
}

type HitOpts = { t?: number; f?: number; type?: BiquadFilterType; q?: number; vol?: number; len?: number; att?: number };
function noiseHit(dest: AudioNode, { t = 0, f = 600, type = "lowpass", q = 1, vol = 0.3, len = 0.14, att = 0.006 }: HitOpts = {}) {
  const t0 = ctx.currentTime + t, s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = noise; fl.type = type; fl.frequency.value = f; fl.Q.value = q;
  g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + att); g.gain.exponentialRampToValueAtTime(0.0005, t0 + len);
  s.connect(fl).connect(g).connect(dest); s.start(t0, Math.random()); s.stop(t0 + len + 0.05);
}

type ToneOpts = { t?: number; f?: number; f2?: number; type?: OscillatorType; vol?: number; len?: number; att?: number };
function tone(dest: AudioNode, { t = 0, f = 60, f2, type = "sine", vol = 0.5, len = 0.4, att = 0.005 }: ToneOpts = {}) {
  const t0 = ctx.currentTime + t, o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t0);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + len);
  g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + att); g.gain.exponentialRampToValueAtTime(0.0005, t0 + len);
  o.connect(g).connect(dest); o.start(t0); o.stop(t0 + len + 0.05);
}

export function step(dest: AudioNode = out, vol = 0.22, t = 0) {
  noiseHit(dest, { t, f: 420 + Math.random() * 260, vol, len: 0.12 });
  noiseHit(dest, { t: t + 0.02, f: 2200, type: "bandpass", q: 2, vol: vol * 0.25, len: 0.05 });
}

function thump() {
  tone(out, { f: 70, f2: 28, vol: 0.9, len: 0.7 });
  noiseHit(out, { f: 180, vol: 0.6, len: 0.5 });
}

export function sting() {
  [1760, 1847, 2489, 2637].forEach((f, i) => tone(out, { f, vol: 0.07, len: 1.1 + i * 0.1, att: 0.01, type: "triangle" }));
  thump();
}

export function scream() {
  const t = ctx.currentTime, ws = ctx.createWaveShaper(), g = ctx.createGain(), curve = new Float32Array(1024);
  for (let i = 0; i < 1024; i++) curve[i] = Math.tanh((i / 512 - 1) * 6);
  ws.curve = curve;
  ws.connect(g).connect(out);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.55, t + 0.02); g.gain.exponentialRampToValueAtTime(0.001, t + 1.7);
  for (const f of [430, 517, 611, 902]) {
    const o = ctx.createOscillator(), v = ctx.createOscillator(), vg = ctx.createGain();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 1.7, t + 0.2); o.frequency.exponentialRampToValueAtTime(f * 0.6, t + 1.6);
    v.frequency.value = 23 + Math.random() * 20; vg.gain.value = f * 0.06;
    v.connect(vg).connect(o.frequency);
    o.connect(ws); o.start(t); v.start(t); o.stop(t + 1.7); v.stop(t + 1.7);
  }
  noiseHit(ws, { f: 1800, type: "highpass", vol: 0.8, len: 1.4 });
  thump();
}

export function whisper(dest: AudioNode = ear, len = 2) {
  const t = ctx.currentTime, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = noise; s.loop = true;
  f.type = "bandpass"; f.frequency.value = 2600; f.Q.value = 3;
  g.gain.setValueAtTime(0, t);
  for (let k = 0; k < len; k += 0.07) g.gain.setValueAtTime(Math.random() < 0.35 ? 0 : 0.5 + Math.random() * 0.6, t + k);
  g.gain.linearRampToValueAtTime(0, t + len);
  s.connect(f).connect(g).connect(dest); s.start(t); s.stop(t + len + 0.1);
}

export function breath() {
  noiseHit(it, { f: 700, type: "bandpass", q: 0.8, vol: 0.5, len: 1.1, att: 0.5 });
  noiseHit(it, { t: 1.3, f: 500, type: "bandpass", q: 0.8, vol: 0.4, len: 1.3, att: 0.2 });
}

export function heart(v: number) {
  tone(out, { f: 52, f2: 40, vol: 0.5 * v, len: 0.25 });
  tone(out, { t: 0.2, f: 48, f2: 38, vol: 0.35 * v, len: 0.25 });
}

export function crack() {
  noiseHit(out, { f: 900, type: "highpass", vol: 0.5, len: 0.3 });
  noiseHit(out, { t: 0.05, f: 300, vol: 0.4, len: 0.2 });
}

// a short-lived panner at a fixed spot, for one sound
function oneShot(at: Vec3, refDistance = 1, rolloffFactor = 1, ms = 1500) {
  const p = new PannerNode(ctx, { panningModel: "HRTF", distanceModel: "inverse", refDistance, rolloffFactor });
  setPos(p, at);
  p.connect(out);
  setTimeout(() => p.disconnect(), ms);
  return p;
}

// a door slams somewhere far behind you
export function slam(at: Vec3) {
  const p = oneShot(at, 2, 0.6);
  tone(p, { f: 90, f2: 35, vol: 0.9, len: 0.6 });
  noiseHit(p, { f: 500, vol: 0.9, len: 0.5, att: 0.002 });
  noiseHit(p, { t: 0.08, f: 3000, type: "bandpass", q: 4, vol: 0.15, len: 0.35 });
}

// a water drop hits a puddle
export function drip(at: Vec3) {
  const p = oneShot(at, 0.8, 1.3);
  tone(p, { f: 1500 + Math.random() * 300, f2: 520, vol: 0.22, len: 0.11, att: 0.002 });
  noiseHit(p, { f: 3200, type: "bandpass", q: 6, vol: 0.06, len: 0.07 });
}

// tiny claws on concrete, and one squeak
export function scurry(at: Vec3) {
  const p = oneShot(at, 1, 1.2, 2000);
  for (let k = 0; k < 10; k++) noiseHit(p, { t: k * 0.045, f: 2500 + Math.random() * 1500, type: "bandpass", q: 3, vol: 0.14, len: 0.04, att: 0.002 });
  tone(p, { t: 0.15, f: 3400, f2: 2700, type: "triangle", vol: 0.03, len: 0.14 });
}

// the quiet scare: a low swell with a thin high tone over it, no hit
export function lowSting() {
  tone(out, { f: 55, f2: 47, vol: 0.35, len: 2.4, att: 0.5 });
  for (const f of [1975, 2093]) tone(out, { f, vol: 0.022, len: 2, att: 0.4 });
}

/* ---------- shotgun + zombies ---------- */
export function shotgun() {
  noiseHit(out, { f: 2400, type: "lowpass", vol: 1, len: 0.45, att: 0.001 });
  noiseHit(out, { f: 140, vol: 1, len: 0.6, att: 0.001 });
  tone(out, { f: 90, f2: 30, vol: 0.9, len: 0.35, att: 0.001 });
}
export function pump() {
  noiseHit(out, { f: 1800, type: "bandpass", q: 3, vol: 0.35, len: 0.06, att: 0.001 });
  noiseHit(out, { t: 0.16, f: 1400, type: "bandpass", q: 3, vol: 0.4, len: 0.07, att: 0.001 });
}
export function click() {
  noiseHit(out, { f: 3000, type: "bandpass", q: 5, vol: 0.2, len: 0.03, att: 0.001 });
}
export function pickup() {
  tone(out, { f: 660, vol: 0.18, len: 0.12, type: "square" });
  tone(out, { t: 0.08, f: 990, vol: 0.18, len: 0.16, type: "square" });
}
export function hurt() {
  tone(out, { f: 160, f2: 90, type: "sawtooth", vol: 0.35, len: 0.25 });
  noiseHit(out, { f: 400, vol: 0.4, len: 0.2 });
}
// a low wet growl from where the zombie is
export function growl(at: Vec3) {
  const p = oneShot(at, 1.5, 1, 2000);
  const f0 = 70 + Math.random() * 40;
  tone(p, { f: f0, f2: f0 * 0.7, type: "sawtooth", vol: 0.35, len: 0.9, att: 0.1 });
  noiseHit(p, { f: 350, type: "bandpass", q: 2, vol: 0.4, len: 0.8, att: 0.15 });
}
export function pain(at: Vec3) {
  const p = oneShot(at, 1.5, 1);
  tone(p, { f: 220, f2: 120, type: "sawtooth", vol: 0.3, len: 0.3 });
}
export function die(at: Vec3) {
  const p = oneShot(at, 1.5, 1, 2000);
  tone(p, { f: 140, f2: 45, type: "sawtooth", vol: 0.4, len: 0.9, att: 0.02 });
  noiseHit(p, { t: 0.5, f: 200, vol: 0.5, len: 0.3 }); // body hits the floor
}
export function impact(at: Vec3) {
  noiseHit(oneShot(at, 1, 1.4), { f: 2500, type: "highpass", vol: 0.12, len: 0.08 });
}

// the turn: air rushing past your ears
export function whoosh() {
  noiseHit(out, { f: 900, type: "bandpass", q: 0.7, vol: 0.5, len: 0.3, att: 0.12 });
}

export function door() {
  tone(out, { f: 38, f2: 30, type: "sawtooth", vol: 0.25, len: 2.5, att: 0.3 });
  noiseHit(out, { f: 250, vol: 0.4, len: 2.2, att: 0.4 });
}

/* ---------- melee, boss, doors far away ---------- */
export function swing() {
  const t = ctx.currentTime, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = noise; f.type = "bandpass"; f.Q.value = 1.4;
  f.frequency.setValueAtTime(350, t); f.frequency.exponentialRampToValueAtTime(1600, t + 0.12); f.frequency.exponentialRampToValueAtTime(500, t + 0.25);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.55, t + 0.1); g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
  s.connect(f).connect(g).connect(out); s.start(t, Math.random()); s.stop(t + 0.3);
}
// the bat lands: a wet crack, a deep thud you feel, and the saw teeth rasping
export function chop(at: Vec3) {
  const p = oneShot(at, 1, 1);
  noiseHit(p, { f: 900, vol: 1, len: 0.25, att: 0.001 });
  noiseHit(p, { f: 2400, type: "bandpass", q: 1.5, vol: 0.5, len: 0.12, att: 0.001 });
  noiseHit(p, { t: 0.03, f: 4200, type: "bandpass", q: 6, vol: 0.18, len: 0.18 });
  tone(out, { f: 95, f2: 38, vol: 1, len: 0.32, att: 0.002 }); // the thud is in your hands, not out there
}
export function roar(at: Vec3) {
  const p = oneShot(at, 3, 0.6, 3000);
  for (const f of [55, 62, 83]) tone(p, { f, f2: f * 0.7, type: "sawtooth", vol: 0.35, len: 1.8, att: 0.2 });
  noiseHit(p, { f: 300, type: "bandpass", q: 1, vol: 0.6, len: 1.6, att: 0.3 });
}
export function skullThrow(at: Vec3) {
  noiseHit(oneShot(at, 2, 1), { f: 500, type: "bandpass", q: 2, vol: 0.4, len: 0.35, att: 0.1 });
}
export function skullBreak(at: Vec3) {
  const p = oneShot(at, 1.5, 1);
  noiseHit(p, { f: 2200, type: "highpass", vol: 0.5, len: 0.3, att: 0.001 });
  noiseHit(p, { t: 0.04, f: 600, vol: 0.4, len: 0.2 });
}
// a heavy door opening somewhere you can't see yet
export function doorAt(at: Vec3) {
  const p = oneShot(at, 3, 0.5, 4000);
  tone(p, { f: 42, f2: 30, type: "sawtooth", vol: 0.4, len: 2.8, att: 0.3 });
  noiseHit(p, { f: 260, vol: 0.6, len: 2.5, att: 0.4 });
  noiseHit(p, { t: 2.6, f: 400, vol: 0.9, len: 0.4, att: 0.001 }); // clunk: open
}

// a big pane of glass breaking
export function glass() {
  noiseHit(out, { f: 3500, type: "highpass", vol: 0.8, len: 0.9, att: 0.001 });
  for (let k = 0; k < 14; k++) tone(out, { t: 0.05 + Math.random() * 0.8, f: 2500 + Math.random() * 3000, vol: 0.05, len: 0.15, type: "triangle" });
  noiseHit(out, { t: 0.02, f: 300, vol: 0.5, len: 0.3 });
}
