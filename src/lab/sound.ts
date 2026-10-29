// Sounds for the thrown objects, synthesized with Web Audio — no sound files, so
// nothing to license or copy. Silent until unlock() runs from a click
// (browsers block audio before a user gesture anyway).

type Ctx = { ac: AudioContext; out: GainNode; noise: AudioBuffer };
let ctx: Ctx | null = null;

export function unlock() {
  if (!ctx) {
    const ac = new AudioContext();
    const out = ac.createGain();
    out.gain.value = 0.5;
    out.connect(ac.destination);
    // 2 s of white noise, reused by every noisy sound.
    const noise = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    ctx = { ac, out, noise };
  }
  return ctx.ac.resume();
}

export function setMuted(muted: boolean) {
  if (ctx) ctx.out.gain.value = muted ? 0 : 0.5;
}

// A gain node panned left/right, already wired to the output.
function voice(c: Ctx, pan: number) {
  const g = c.ac.createGain();
  const p = c.ac.createStereoPanner();
  p.pan.value = Math.max(-1, Math.min(1, pan));
  g.connect(p).connect(c.out);
  return g;
}

function noiseSrc(c: Ctx) {
  const s = c.ac.createBufferSource();
  s.buffer = c.noise;
  s.loop = true;
  return s;
}

// Short decaying sine partial: the building block of every "clink".
function partial(c: Ctx, dest: AudioNode, freq: number, t: number, len: number, level: number, type: OscillatorType = "sine") {
  const o = c.ac.createOscillator();
  const g = c.ac.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(level, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  o.connect(g).connect(dest);
  o.start(t);
  o.stop(t + len + 0.05);
}

function noiseBurst(c: Ctx, dest: AudioNode, t: number, len: number, freq: number, q: number, level: number) {
  const s = noiseSrc(c);
  const f = c.ac.createBiquadFilter();
  const g = c.ac.createGain();
  f.type = "bandpass";
  f.frequency.value = freq;
  f.Q.value = q;
  g.gain.setValueAtTime(level, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  s.connect(f).connect(g).connect(dest);
  s.start(t, Math.random());
  s.stop(t + len + 0.05);
}

// Air rushing past while something flies in: band-passed noise whose
// pitch and level rise over the flight, panned from where it starts to
// where it ends.
export function whoosh(seconds: number, panFrom: number, panTo: number) {
  if (!ctx || ctx.ac.state !== "running") return;
  const c = ctx;
  const t = c.ac.currentTime;
  const s = noiseSrc(c);
  const f = c.ac.createBiquadFilter();
  const g = c.ac.createGain();
  const p = c.ac.createStereoPanner();
  f.type = "bandpass";
  f.Q.value = 1.2;
  f.frequency.setValueAtTime(250, t);
  f.frequency.exponentialRampToValueAtTime(2200, t + seconds);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.35, t + seconds * 0.9);
  g.gain.exponentialRampToValueAtTime(0.0001, t + seconds + 0.25);
  p.pan.setValueAtTime(panFrom, t);
  p.pan.linearRampToValueAtTime(panTo, t + seconds);
  s.connect(f).connect(g).connect(p).connect(c.out);
  s.start(t, Math.random());
  s.stop(t + seconds + 0.3);
}

// The thing's own sound as it passes the viewer.
export function pass(name: string, pan: number) {
  if (!ctx || ctx.ac.state !== "running") return;
  const c = ctx;
  const t = c.ac.currentTime;
  const v = voice(c, pan);
  switch (name) {
    case "can": // tin clank: inharmonic partials + a rattle
      [523, 1247, 2093, 3301].forEach((f, i) => partial(c, v, f, t, 0.35 - i * 0.06, 0.25 / (i + 1)));
      noiseBurst(c, v, t, 0.08, 3000, 2, 0.4);
      partial(c, v, 610, t + 0.12, 0.25, 0.12);
      break;
    case "ball": // two bounces: a sine thump dropping in pitch
      [0, 0.28].forEach((d, i) => {
        const o = c.ac.createOscillator();
        const g = c.ac.createGain();
        o.frequency.setValueAtTime(190, t + d);
        o.frequency.exponentialRampToValueAtTime(55, t + d + 0.18);
        g.gain.setValueAtTime(0.7 / (i + 1), t + d);
        g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.22);
        o.connect(g).connect(v);
        o.start(t + d);
        o.stop(t + d + 0.3);
      });
      break;
    case "saw": { // spinning blade whine with a doppler drop
      const o = c.ac.createOscillator();
      const lfo = c.ac.createOscillator();
      const lg = c.ac.createGain();
      const f = c.ac.createBiquadFilter();
      const g = c.ac.createGain();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(1100, t);
      o.frequency.exponentialRampToValueAtTime(620, t + 0.9);
      lfo.frequency.value = 38;
      lg.gain.value = 40;
      lfo.connect(lg).connect(o.frequency);
      f.type = "bandpass";
      f.frequency.value = 1800;
      f.Q.value = 0.8;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.25, t + 0.08);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1);
      o.connect(f).connect(g).connect(v);
      o.start(t);
      lfo.start(t);
      o.stop(t + 1.05);
      lfo.stop(t + 1.05);
      break;
    }
    case "skull": // hollow bony chatter: quick clicks
      for (let i = 0; i < 6; i++) noiseBurst(c, v, t + i * 0.055, 0.04, 900 + Math.random() * 500, 6, 0.6);
      partial(c, v, 180, t, 0.3, 0.25, "triangle");
      break;
    case "knife": { // swish + blade ring ("schwing")
      const s = noiseSrc(c);
      const f = c.ac.createBiquadFilter();
      const g = c.ac.createGain();
      f.type = "bandpass";
      f.Q.value = 3;
      f.frequency.setValueAtTime(2000, t);
      f.frequency.exponentialRampToValueAtTime(8000, t + 0.25);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.5, t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      s.connect(f).connect(g).connect(v);
      s.start(t, Math.random());
      s.stop(t + 0.35);
      [3150, 4720].forEach((fr, i) => partial(c, v, fr, t + 0.08, 0.9, 0.08 / (i + 1)));
      break;
    }
    case "teapot": // porcelain clink, lid rattling once
      [1760, 2640, 4100].forEach((f, i) => partial(c, v, f, t, 0.5 - i * 0.12, 0.18 / (i + 1)));
      [1980, 2970].forEach((f, i) => partial(c, v, f, t + 0.14, 0.3, 0.1 / (i + 1)));
      break;
  }
}
