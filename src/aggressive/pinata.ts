// The contact page: a llama piñata on a rope. A saw blade cuts it in two, the
// halves fall away and the three links drop out as blue models: a phone, a cat
// for GitHub and a letter for the mail. Each model is its link once it's landed.
import * as THREE from "three";
import { bladeGeometry } from "../contact/skull/parts";
import { half, loadModel, wireModel } from "./models";
import { BLUE, COLORS, box, dispose, dragTurn, group, part, place, reducedMotion, runScene, shape, sketched } from "./wire-kit";

const CUT_AT = 1.6; // s until the blade reaches the piñata
const FLOOR = -2.7; // where things stand
const GRAVITY = 9;
const SIZE = 1.05; // a fallen model's radius
const REST = [-2, 0, 2];
const LLAMA_TURN = 0; // its long side along x, head to the right

// No scan reads as a letter, so this one is a clean drawing.
const envelope = () => sketched(() => group(
  box(1.9, 1.3, 0.04, 1, 1, 1, BLUE),
  place(shape([[-0.95, 0.65], [0.95, 0.65], [0, -0.12]], 0.015, BLUE), 0, 0, 0.04),
));

export function createPinata(canvas: HTMLCanvasElement, links: HTMLElement[]) {
  const page = canvas.closest<HTMLElement>(".ai-page")!;
  const reduced = reducedMotion();
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 40);
  camera.position.set(0, 0, 10);
  const root = new THREE.Group();
  scene.add(root);
  root.add(place(box(8, 0.01, 0.01, 1, 1, 1, { opacity: 0.5, sketch: true }), 0, FLOOR, 0));

  const rope = place(box(0.02, 4.4, 0.02, 1, 1, 1, { sketch: true }), 0, 2.5, 0);
  const blade = part(bladeGeometry(), { ...BLUE, sketch: true });
  blade.scale.setScalar(1.6);
  blade.visible = false;
  root.add(rope, blade);

  const front = new THREE.Group(), back = new THREE.Group();
  const pinata = new THREE.Group();
  pinata.add(front, back);
  pinata.position.y = 0.3;
  pinata.rotation.y = LLAMA_TURN;
  root.add(pinata);

  type Icon = { o: THREE.Object3D; x: number; y: number; vx: number; vy: number; spin: number; landed: boolean; angle: number; restY: number; top: number };
  const icons: Icon[] = [];
  let clock = -1, stopped = false;

  void Promise.all(["llama", "phone", "cat"].map(loadModel)).then(([llama, ...drops]) => {
    if (stopped) return;
    front.add(wireModel(half(llama, 1)));
    back.add(wireModel(half(llama, -1)));
    pinata.scale.setScalar(2.1);
    const models: { o: THREE.Object3D; bottom: number; top: number }[] = drops.map((geo) => {
      geo.computeBoundingBox();
      return { o: wireModel(geo, COLORS.blue), bottom: geo.boundingBox!.min.y, top: geo.boundingBox!.max.y };
    });
    models.push({ o: envelope(), bottom: -0.65, top: 0.65 });
    models.forEach(({ o, bottom, top }, i) => {
      o.scale.setScalar(SIZE);
      o.visible = false;
      root.add(o);
      // Standing on the floor, whatever its shape.
      const restY = FLOOR - bottom * SIZE;
      icons.push({ o, x: 0, y: 0.3, vx: REST[i] / 0.9, vy: 2 + i * 0.3, spin: 7 - i * 3, landed: false, angle: 0, restY, top: restY + top * SIZE });
    });
    clock = 0;
    blade.visible = true;
  });

  const placeLink = (i: number) => {
    const at = (y: number) => new THREE.Vector3(REST[i], y, 0).project(camera);
    const r = canvas.getBoundingClientRect(), top = at(icons[i].top), foot = at(FLOOR - 0.45);
    const px = (v: THREE.Vector3) => ((1 - v.y) / 2) * r.height + r.top + page.scrollTop;
    const link = links[i];
    link.style.left = `${((top.x + 1) / 2) * r.width + r.left}px`;
    link.style.top = `${px(top)}px`;
    link.style.height = `${px(foot) - px(top)}px`;
    link.style.width = `${((SIZE * 2) / (camera.position.z * Math.tan((35 * Math.PI) / 360) * 2 * camera.aspect)) * r.width}px`;
    link.classList.add("is-on");
  };

  // Dragging a link turns its model, without following the link.
  const turns = links.map((link) => {
    const turn = dragTurn(link);
    link.addEventListener("click", (e) => { if (turn.moved) e.preventDefault(); });
    return turn;
  });

  // Pointing at a link lifts its model.
  const lift = [0, 0, 0], liftTo = [0, 0, 0];
  links.forEach((link, i) => {
    const set = (v: number) => () => { liftTo[i] = v; };
    link.addEventListener("pointerenter", set(1));
    link.addEventListener("pointerleave", set(0));
    link.addEventListener("focus", set(1));
    link.addEventListener("blur", set(0));
  });

  const handle = runScene(canvas, camera, scene, (_, dt) => {
    // Narrow canvas: step back until all three fit.
    camera.position.z = Math.max(11, 11 / camera.aspect);
    camera.updateMatrixWorld();
    if (clock < 0) return;
    clock += dt; // frame time: a slow start can't skip the cut
    const t = reduced ? CUT_AT + 4 : clock;
    if (t < CUT_AT) pinata.rotation.z = Math.sin(t * 3) * 0.06;
    rope.visible = t < CUT_AT + 0.4;
    const k = Math.min(t / CUT_AT, 1);
    blade.position.set(-7 + 7 * k * k + (t > CUT_AT ? (t - CUT_AT) * 11 : 0), 0.5, 1.2);
    blade.rotation.z = -t * 18;
    blade.visible = t < CUT_AT + 0.9;
    const after = Math.max(t - CUT_AT, 0);
    const drop = 0.5 * GRAVITY * after * after; // falls out of the picture, only the links stay
    front.position.set(Math.min(after, 1.4) * 0.35, -drop / 2.1, 0);
    front.rotation.z = -Math.min(after * 0.9, 0.8);
    back.position.set(-Math.min(after, 1.4) * 0.35, -drop / 2.1, 0);
    back.rotation.z = Math.min(after * 0.9, 0.8);
    pinata.visible = drop < 12;
    if (t < CUT_AT) return;
    icons.forEach((icon, i) => {
      icon.o.visible = true;
      if (icon.landed) {
        lift[i] += (liftTo[i] - lift[i]) * 0.2;
        icon.o.position.y = icon.restY + lift[i] * 0.3;
        icon.o.scale.setScalar(SIZE * (1 + lift[i] * 0.12));
        icon.o.rotation.set(turns[i].x, turns[i].y, 0);
        return;
      }
      if (reduced) { icon.y = icon.restY; icon.x = REST[i]; icon.vy = 0; }
      icon.vy -= GRAVITY * dt;
      icon.x += icon.vx * dt;
      icon.y += icon.vy * dt;
      icon.angle += icon.spin * dt;
      if (icon.y < icon.restY) {
        icon.y = icon.restY;
        icon.vx = (REST[i] - icon.x) * 2.2;
        if (Math.abs(icon.vy) < 1.6) {
          icon.landed = true;
          icon.x = REST[i];
          icon.o.rotation.set(0, 0, 0);
          icon.o.position.set(icon.x, icon.y, 0);
          placeLink(i);
          return;
        }
        icon.vy *= -0.45;
        icon.spin *= 0.5;
      }
      icon.o.position.set(icon.x, icon.y, 0);
      icon.o.rotation.set(0, icon.angle * 0.6, icon.angle);
    });
  });

  return {
    paint: handle.paint,
    stop() {
      stopped = true;
      handle.stop();
      turns.forEach((t) => t.stop());
      dispose(root);
    },
  };
}
