// Physics for the contact section's click-to-shatter effect — ported from
// the old SAOS.ME site's SaosAnimation.js (gravity, wall/floor bounce with
// restitution, letter-letter collision, mouse-velocity push).
//
// Adapted to run in "offset from rest position" space instead of absolute
// page coordinates: SaosAnimation.js detaches each letter to `position:fixed`
// on document.body, which doesn't work here — the mail address's letters and
// the icons' <a> elements must stay real DOM children of their actual links
// (so a click anywhere on a scattered piece still fires mailto/etc.), and a
// transformed ancestor (the entrance tween's inline transform on the outer
// .letter/<li>) would make position:fixed relative to that box, not the
// viewport. Driving a transform offset instead sidesteps both problems and
// matches how the rest of this codebase (entrance tween, idle float) already
// animates these elements — see contact.ts's startBreak/returnHome.
//
// Pure math, no DOM writes and no GSAP dependency — contact.ts owns the rAF
// loop and renders each body's (ox, oy, rotation) via gsap.set every frame.

export interface PhysicsConfig {
  gravity: number;
  restitution: number;
  frictionAir: number;
  frictionFloorX: number;
  frictionFloorAng: number;
}

export interface PhysicsBody {
  el: HTMLElement;
  restCenterX: number;
  restCenterY: number;
  radius: number;
  minOx: number; // left wall, offset space
  maxOx: number; // right wall
  maxOy: number; // floor
  ox: number;
  oy: number;
  rotation: number;
  vx: number;
  vy: number;
  angularVelocity: number;
  grounded: boolean;
}

// Captures `el`'s current on-screen rect once (its "rest" position) and
// derives this body's floor/wall thresholds from it — every body ends up in
// the same shared offset space even though each starts from a different
// natural position.
export function makeBody(
  el: HTMLElement,
  floorY: number,
  viewportWidth: number,
): PhysicsBody {
  const r = el.getBoundingClientRect();
  return {
    el,
    restCenterX: r.left + r.width / 2,
    restCenterY: r.top + r.height / 2,
    radius: (r.width + r.height) / 4,
    minOx: -r.left,
    maxOx: viewportWidth - r.right,
    maxOy: floorY - r.bottom,
    ox: 0,
    oy: 0,
    rotation: 0,
    vx: 0,
    vy: 0,
    angularVelocity: 0,
    grounded: false,
  };
}

// One frame: gravity + integration + wall/floor bounce, then collisions.
// Grounded bodies skip their own integration but still take part in
// collision resolution below, so a body landing on a resting one can still
// knock it loose (mirrors SaosAnimation.js's physicsStep/resolveCollisions).
export function stepPhysics(bodies: PhysicsBody[], config: PhysicsConfig) {
  const { gravity, restitution, frictionAir, frictionFloorX, frictionFloorAng } =
    config;

  for (const b of bodies) {
    if (b.grounded) continue;

    b.vx *= 1 - frictionAir;
    b.vy *= 1 - frictionAir;
    b.angularVelocity *= 1 - frictionAir;

    b.vy += gravity;
    b.ox += b.vx;
    b.oy += b.vy;
    b.rotation += b.angularVelocity;

    if (b.ox < b.minOx) {
      b.ox = b.minOx;
      b.vx = Math.abs(b.vx) * restitution;
      b.angularVelocity *= -0.7;
    }
    if (b.ox > b.maxOx) {
      b.ox = b.maxOx;
      b.vx = -Math.abs(b.vx) * restitution;
      b.angularVelocity *= -0.7;
    }
    if (b.oy > b.maxOy) {
      b.oy = b.maxOy;
      b.vy = -Math.abs(b.vy) * restitution;
      b.vx *= frictionFloorX;
      b.angularVelocity *= frictionFloorAng;

      if (Math.abs(b.vy) < 1.2 && Math.abs(b.vx) < 0.5) {
        b.vy = 0;
        b.vx = 0;
        b.angularVelocity = 0;
        b.grounded = true;
      }
    }
  }

  resolveCollisions(bodies, restitution);
}

function resolveCollisions(bodies: PhysicsBody[], restitution: number) {
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const a = bodies[i];
      const b = bodies[j];
      const acx = a.restCenterX + a.ox;
      const acy = a.restCenterY + a.oy;
      const bcx = b.restCenterX + b.ox;
      const bcy = b.restCenterY + b.oy;
      const dx = bcx - acx;
      const dy = bcy - acy;
      const dist = Math.hypot(dx, dy) || 0.0001;
      const minD = a.radius + b.radius;
      if (dist >= minD) continue;

      const overlap = (minD - dist) * 0.5;
      const nx = dx / dist;
      const ny = dy / dist;

      a.ox -= nx * overlap;
      a.oy -= ny * overlap;
      b.ox += nx * overlap;
      b.oy += ny * overlap;

      const dvx = b.vx - a.vx;
      const dvy = b.vy - a.vy;
      const dot = dvx * nx + dvy * ny;
      if (dot < 0) continue; // already separating

      const imp = dot * (1 + restitution) * 0.5;
      a.vx += imp * nx;
      a.vy += imp * ny;
      b.vx -= imp * nx;
      b.vy -= imp * ny;

      a.grounded = false;
      b.grounded = false;
    }
  }
}

// Nudges every body within `mouseRadius` of the pointer, proportional to how
// fast the pointer is moving — lets settled letters/icons keep getting
// pushed around ("herum fliegen") instead of staying inert once landed.
export function applyMouseForce(
  bodies: PhysicsBody[],
  mouseX: number,
  mouseY: number,
  deltaX: number,
  deltaY: number,
  mouseRadius: number,
) {
  const speed = Math.hypot(deltaX, deltaY);
  if (speed < 0.5) return;

  for (const b of bodies) {
    const cx = b.restCenterX + b.ox;
    const cy = b.restCenterY + b.oy;
    const dx = cx - mouseX;
    const dy = cy - mouseY;
    const dist = Math.hypot(dx, dy) || 1;
    if (dist >= mouseRadius) continue;

    const force = speed * 0.3;
    b.vx += (dx / dist) * force;
    b.vy += (dy / dist) * force;
    b.angularVelocity += (Math.random() - 0.5) * force * 0.3;
    b.grounded = false;
  }
}
