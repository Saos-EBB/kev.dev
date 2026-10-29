// Hinter dir — things that move on their own: dust in the flashlight beam,
// swinging bulbs, water dripping into puddles, rats crossing the corridor
// ahead. Everything here is decoration: no gameplay depends on it.
import * as THREE from "three";
import * as sfx from "./horror-audio";

type Cell = [number, number];
export type LifeWorld = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  pixelRatio: () => number;
  C: number; // cell size
  WH: number; // wall height
  corridors: Cell[]; // straight corridor cells (two opposite openings)
  openDirs: (x: number, z: number) => Cell[];
  solidAt: (x: number, z: number) => boolean;
  clearLine: (a: THREE.Vector3, b: THREE.Vector3) => boolean;
};

// spread n picks evenly over a list, starting at an offset
const spread = <T>(list: T[], n: number, offset: number) => Array.from({ length: n }, (_, i) => list[Math.floor(((i + offset) / n) * (list.length - 1))]);

export function createLife(w: LifeWorld) {
  const { scene, camera, C, WH } = w;
  const tmp = new THREE.Vector3(), fwd = new THREE.Vector3();
  let t = 0;

  /* ---------- dust: visible only inside the flashlight cone (one draw call) ---------- */
  const N = 500, R = 5;
  const dustPos = new Float32Array(N * 3), seed = new Float32Array(N);
  for (let i = 0; i < N; i++) { dustPos[i * 3] = (Math.random() - 0.5) * 2 * R; dustPos[i * 3 + 1] = Math.random() * WH; dustPos[i * 3 + 2] = (Math.random() - 0.5) * 2 * R; seed[i] = Math.random() * 100; }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
  const dustMat = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(0xffd9a8) }, uLight: { value: 1 }, uSize: { value: 5 } },
    vertexShader: /* glsl */ `
      uniform float uSize; varying float vA;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        float d = length(mv.xyz);
        float c = dot(mv.xyz / d, normalize(vec3(0.0, -0.03, -1.0)));   // angle to the beam
        vA = smoothstep(0.84, 0.96, c) * smoothstep(8.0, 1.0, d) * smoothstep(0.2, 0.6, d);
        gl_PointSize = uSize / d;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uLight; varying float vA;
      void main() {
        vec2 q = gl_PointCoord - 0.5; float r = dot(q, q);
        if (r > 0.25) discard;
        gl_FragColor = vec4(uColor, vA * uLight * (1.0 - r * 4.0) * 0.55);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  dust.frustumCulled = false;
  scene.add(dust);

  /* ---------- hanging bulbs that swing (some still glow, some are dead) ---------- */
  const glowCv = document.createElement("canvas");
  glowCv.width = glowCv.height = 64;
  const g = glowCv.getContext("2d")!, grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, "#ffb36aff"); grd.addColorStop(0.25, "#ff8a3a55"); grd.addColorStop(1, "#ff8a3a00");
  g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
  const glowMat = new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(glowCv), blending: THREE.AdditiveBlending, depthWrite: false });
  const cordGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.8, 4).translate(0, -0.4, 0);
  const cordMat = new THREE.MeshBasicMaterial({ color: 0x0c0b0a });
  const bulbGeo = new THREE.SphereGeometry(0.055, 10, 8);
  const bulbs = spread(w.corridors, 6, 0.1).map(([x, z], i) => {
    const lit = i % 3 !== 2;
    const pivot = new THREE.Group();
    pivot.position.set(x * C, WH, z * C);
    pivot.add(new THREE.Mesh(cordGeo, cordMat));
    const mat = new THREE.MeshBasicMaterial({ color: lit ? 0xffc890 : 0x2a2622 });
    const bulb = new THREE.Mesh(bulbGeo, mat);
    bulb.position.y = -0.85;
    pivot.add(bulb);
    const glow = lit ? new THREE.Sprite(glowMat) : null;
    if (glow) { glow.scale.setScalar(0.7); bulb.add(glow); }
    scene.add(pivot);
    return { pivot, mat, glow, lit, phase: Math.random() * 6, speed: 1.1 + Math.random() * 0.6 };
  });

  /* ---------- water dripping from the ceiling into puddles ---------- */
  const puddleMat = new THREE.MeshStandardMaterial({ color: 0x0d1012, roughness: 0.06, metalness: 0.5 });
  const dropMat = new THREE.MeshBasicMaterial({ color: 0x8c9a9e });
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x9fb0b5, transparent: true, depthWrite: false });
  const drips = spread(w.corridors, 4, 0.55).map(([x, z]) => {
    const at = new THREE.Vector3(x * C + (Math.random() - 0.5) * 0.8, 0, z * C + (Math.random() - 0.5) * 0.8);
    const puddle = new THREE.Mesh(new THREE.CircleGeometry(0.28 + Math.random() * 0.2, 20), puddleMat);
    puddle.rotation.x = -Math.PI / 2; puddle.position.copy(at).setY(0.004); puddle.receiveShadow = true;
    const drop = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 4), dropMat);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 24), ringMat.clone());
    ring.rotation.x = -Math.PI / 2; ring.position.copy(at).setY(0.008); ring.visible = false;
    scene.add(puddle, drop, ring);
    return { at, drop, ring, y: WH, v: 0, wait: Math.random() * 3, ripple: -1 };
  });

  /* ---------- a rat that runs across the corridor ahead of you ---------- */
  const rat = new THREE.Group();
  const ratMat = new THREE.MeshStandardMaterial({ color: 0x1a1612, roughness: 0.9 });
  const ratBody = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), ratMat);
  ratBody.scale.set(0.055, 0.045, 0.12);
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.008, 0.18, 4), ratMat);
  tail.rotation.x = Math.PI / 2 - 0.15; tail.position.set(0, 0.01, 0.2);
  rat.add(ratBody, tail);
  rat.traverse((o) => { o.castShadow = true; });
  rat.visible = false;
  scene.add(rat);
  const run = { from: new THREE.Vector3(), to: new THREE.Vector3(), t: -1, len: 1, next: 12 };

  function tryRat() {
    camera.getWorldDirection(fwd);
    for (let d = 4; d <= 8; d++) {
      tmp.copy(camera.position).addScaledVector(fwd, d);
      const cx = Math.round(tmp.x / C), cz = Math.round(tmp.z / C);
      const center = new THREE.Vector3(cx * C, 0.3, cz * C);
      if (w.solidAt(center.x, center.z) || !w.clearLine(camera.position, center)) continue;
      // run across your view if the cell lets it, else along the corridor
      const dirs = w.openDirs(cx, cz);
      const across = dirs.find(([dx, dz]) => Math.abs(dx * fwd.x + dz * fwd.z) < 0.5) ?? dirs[0];
      run.from.set(cx * C - across[0] * C * 0.4, 0.045, cz * C - across[1] * C * 0.4);
      run.to.set(cx * C + across[0] * C * 1.1, 0.045, cz * C + across[1] * C * 1.1);
      run.len = run.from.distanceTo(run.to) / 3.8; // seconds at 3.8 m/s
      run.t = 0;
      rat.visible = true;
      // the tail is on +z, so +z looks back the way it came and the head (-z) points at the target
      rat.position.copy(run.from);
      rat.lookAt(tmp.copy(run.from).multiplyScalar(2).sub(run.to));
      sfx.scurry(center);
      return;
    }
  }

  /* ---------- per frame ---------- */
  return function updateLife(dt: number, flick: number, dread: number, playing: boolean) {
    t += dt;
    const cam = camera.position;

    // dust drifts and wraps around you
    dustMat.uniforms.uLight.value = flick;
    dustMat.uniforms.uSize.value = 5 * w.pixelRatio();
    for (let i = 0; i < N; i++) {
      const k = i * 3, s = seed[i];
      dustPos[k] += Math.sin(t * 0.3 + s) * 0.04 * dt;
      dustPos[k + 1] += (Math.cos(t * 0.23 + s * 1.7) * 0.03 - 0.01) * dt;
      dustPos[k + 2] += Math.cos(t * 0.27 + s * 0.6) * 0.04 * dt;
      if (dustPos[k] - cam.x > R) dustPos[k] -= 2 * R; else if (dustPos[k] - cam.x < -R) dustPos[k] += 2 * R;
      if (dustPos[k + 2] - cam.z > R) dustPos[k + 2] -= 2 * R; else if (dustPos[k + 2] - cam.z < -R) dustPos[k + 2] += 2 * R;
      if (dustPos[k + 1] < 0.05) dustPos[k + 1] += WH - 0.1; else if (dustPos[k + 1] > WH) dustPos[k + 1] -= WH - 0.1;
    }
    dustGeo.attributes.position.needsUpdate = true;

    // bulbs swing harder the more scared you are; lit ones flicker with your lamp
    const amp = 0.06 + (dread / 100) * 0.12;
    for (const b of bulbs) {
      b.pivot.rotation.z = amp * Math.sin(t * b.speed + b.phase);
      b.pivot.rotation.x = amp * 0.6 * Math.cos(t * b.speed * 0.8 + b.phase);
      if (b.lit) {
        const on = flick > 0.3 && Math.random() > 0.01 ? 1 : 0.15;
        b.mat.color.setRGB(1 * on, 0.78 * on, 0.56 * on);
        b.glow!.material.opacity = on;
      }
    }

    // drops fall, hit the puddle, ripple
    for (const d of drips) {
      if (d.wait > 0) { d.wait -= dt; d.drop.visible = false; }
      else {
        d.drop.visible = true;
        d.v += 9.8 * dt; d.y -= d.v * dt;
        if (d.y <= 0.01) {
          d.y = WH - 0.02; d.v = 0; d.wait = 1.5 + Math.random() * 2.5; d.ripple = 0;
          if (d.at.distanceTo(cam) < 9) sfx.drip(d.at);
        }
        d.drop.position.set(d.at.x, d.y, d.at.z);
      }
      if (d.ripple >= 0) {
        d.ripple += dt;
        const k = d.ripple / 0.7;
        d.ring.visible = k < 1;
        d.ring.scale.setScalar(0.03 + k * 0.25);
        (d.ring.material as THREE.MeshBasicMaterial).opacity = 0.5 * (1 - k);
        if (k >= 1) d.ripple = -1;
      }
    }

    // a rat now and then, only while you play
    if (playing) {
      run.next -= dt;
      if (run.t < 0 && run.next <= 0) { run.next = 14 + Math.random() * 16; tryRat(); }
    }
    if (run.t >= 0) {
      run.t += dt;
      const k = Math.min(1, run.t / run.len);
      rat.position.lerpVectors(run.from, run.to, k);
      rat.position.y = 0.045 + Math.abs(Math.sin(run.t * 40)) * 0.012;
      if (k >= 1) { run.t = -1; rat.visible = false; }
    }
  };
}
