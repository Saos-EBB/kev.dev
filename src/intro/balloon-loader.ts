// Loader: four burgundy foil letter balloons in front of a mirror, pumped up
// with the real loading progress. Full, they shudder and burst, and the hero
// shows through the hole. Same contract as mountSaosLoader, which remains the
// fallback (no WebGL 2, reduced motion, worker failure before anything showed).
//
// The shapes come from balloon-field.worker.ts; the look is one fragment
// shader: a studio with hard lights that foil and glass both reflect, the
// floor showing everything flipped. The shreds are a 2D canvas above it,
// computed from time alone.

import "./saos-intro.css";
import { UI } from "../i18n/ui";
import { LITE } from "../viewport";
import { mountSaosLoader } from "./saos-intro";

const LETTERS = "SAOS";
// Three pump strokes in seconds: a fast load still gets the whole show.
const STROKES: [number, number, number][] = [[0.15, 1.05, 0.34], [1.3, 2.2, 0.66], [2.45, 3.3, 1]];
const OVER_S = 0.8; // full: shudders before the pop
const BURST_S = 1.15; // the hole opens over this long
const END_S = 1.9; // after the pop: the last shreds are gone, the overlay goes
const SHREDS = ["#8d0a2a", "#e0526f", "#3a000e", "#f2c9d2"];

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const ease = (x: number) => x * x * (3 - 2 * x);
const seeded = (i: number, salt: number) => {
  const v = Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

function pumped(s: number) {
  let p = 0, from = 0;
  for (const [a, b, to] of STROKES) {
    p = from + (to - from) * ease(clamp01((s - a) / (b - a)));
    from = to;
    if (s < b) break;
  }
  return p;
}

const VERT = `#version 300 es
in vec2 a; void main(){ gl_Position = vec4(a, 0., 1.); }`;
const FRAG = `#version 300 es
precision highp float;
uniform sampler2D F, K; uniform vec2 R, C; uniform float S, A, t, press, over, burst, floorY;
uniform vec2 off[4];
out vec4 o;
float hash(vec2 p){ vec3 q=fract(vec3(p.xyx)*.1031); q+=dot(q,q.yzx+33.33); return fract((q.x+q.y)*q.z); }
float noise(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y); }
float fbm(vec2 p){ float a=.5,s=0.; for(int i=0;i<3;i++){ s+=a*noise(p); p=p*2.03+7.1; a*=.5; } return s; }
float box(vec2 q,vec2 c,vec2 h,float e){ vec2 d=abs(q-c)-h; return smoothstep(e,0.,max(d.x,d.y)); }

// The studio the foil and the glass both see: dark room, hard softboxes.
vec3 studio(vec3 r){
  vec2 q=r.xy/(abs(r.z)+.42);
  q.x+=.03*sin(t*.2);
  vec3 c=mix(vec3(.2,.21,.24),vec3(.62,.64,.68),smoothstep(-.3,1.5,q.y));
  c=mix(mix(vec3(.5,.51,.54),vec3(.09,.09,.1),smoothstep(-.02,-1.1,q.y)),c,smoothstep(-.2,.08,q.y));
  // a tall paned window, a strip light and a ceiling bar: hard edges make it a reflection
  float pane=box(q,vec2(-.62,.68),vec2(.46,.34),.02);
  pane*=smoothstep(.0,.012,abs(q.x+.62)-.008)*smoothstep(.0,.012,abs(q.y-.68)-.008);
  c+=vec3(1.6,1.58,1.55)*pane;
  c+=vec3(1.15)*box(q,vec2(.98,.2),vec2(.08,.7),.02);
  c+=vec3(.9)*box(q,vec2(.15,1.3),vec2(.8,.05),.02);
  c+=vec3(.6)*box(q,vec2(-1.3,-.15),vec2(.05,.55),.02);
  return c;
}

float L;
vec2 letterUv(vec2 p,int i){
  vec2 q=(p-C-off[i]*(.35+over))/S;
  return vec2(q.x/A+.5,.5-q.y);
}
float slack(){ return pow(1.-press,1.5); }
float height(vec2 uv,int i,vec2 p){
  float x=max(texture(F,uv)[i]-L,0.);
  float h=sqrt(x/(1.-L));
  float rim=smoothstep(.62,.08,h);
  float sl=slack();
  h+=(texture(K,uv)[i]-.5)*(.055+.2*sl)*rim*smoothstep(0.,.05,h);
  if(sl>.001) h+=sl*.3*abs(fbm(p*vec2(22.,29.))-.5)*smoothstep(0.,.2,h);
  return h;
}
// Front letters last, so they sit over the one behind; each drops a soft shadow first.
vec4 balloons(vec2 p){
  vec3 col=vec3(0.); float a=0.;
  for(int i=0;i<4;i++){
    vec2 u=letterUv(p,i);
    float below=texture(F,letterUv(p+vec2(.02,.018)*S,i))[i]-L;
    if(a>0.) col*=1.-.55*smoothstep(0.,.1,below);
    float v=texture(F,u)[i]-L;
    if(v<=.0) continue;
    float e=.0022;
    float h=height(u,i,p);
    vec2 dh=vec2(height(letterUv(p+vec2(e,0),i),i,p+vec2(e,0))-h,height(letterUv(p+vec2(0,e),i),i,p+vec2(0,e))-h)/e;
    vec3 n=normalize(vec3(-dh*.042/S,1.));
    vec3 r=reflect(vec3(0,0,-1),n);
    vec3 env=studio(r);
    float fres=pow(1.-max(n.z,0.),2.5);
    // metal: the tint colours the reflection, the brightest lights burn through to pale pink
    vec3 tint=vec3(.78,.03,.105);
    vec3 m=env*tint*1.55+tint*.14;
    m+=max(env-.95,0.)*vec3(1.,.82,.86)*.8;
    m=mix(m,m*.42+vec3(.03,.0,.008),fres*.65);
    // the flat welded seam around each letter
    float seam=smoothstep(.2,.09,h);
    m=mix(m,tint*(.28+.9*env.r),seam*.85);
    m*=1.-.5*smoothstep(.035,.0,abs(h-.2));
    // near bursting the foil goes thin and paler
    m=mix(m,m*1.25+vec3(.14,.05,.07),over*over*smoothstep(.3,1.,h));
    float fw=fwidth(v)+1e-5; float al=smoothstep(.004-fw,.004+fw,v);
    col=mix(col,m,al); a=max(a,al);
  }
  return vec4(col,a);
}
// The silver mirror wall: bright, flat, faintly bent, joined from panels.
vec3 wall(vec2 q,vec2 rp){
  vec2 w=vec2(fbm(q*.8+vec2(0.,t*.03)),fbm(q*.8+vec2(5.,t*.025)))-.5;
  vec3 n=normalize(vec3(w*.045+(q-vec2(0.,.12))*vec2(-.62,-.7),1.));
  vec3 c=studio(reflect(vec3(0,0,-1),n));
  c=c*1.05+vec3(.14,.15,.17);
  float seam=smoothstep(.004,.0,abs(fract(q.x*.62+.5)-.5)/.62);
  c=mix(c,c*.45,seam*.7);
  return c;
}
void main(){
  vec2 p=(gl_FragCoord.xy-.5*R)/min(R.y,R.x*.62);
  L=mix(.42,0.,press);
  float r=length(p-C);
  float ringAt=burst*2.6;
  float ring=burst>0.?smoothstep(.22,.0,abs(r-ringAt))*(1.-burst):0.;
  vec2 mp=p+normalize(p-C+1e-4)*ring*.12;

  bool onFloor=mp.y<floorY;
  float fd=max(floorY-mp.y,0.);
  // In the floor everything comes back flipped, sharp near the line and rippling further out.
  vec2 q=onFloor?vec2(mp.x+(fbm(mp*vec2(3.,9.)+t*.05)-.5)*fd*.1,2.*floorY-mp.y):mp;
  vec3 col=wall(q,mp);
  if(burst<=0.){
    // floating soft shadow on the wall
    float sh=0.; for(int i=0;i<4;i++) sh=max(sh,texture(F,letterUv(q+vec2(-.03,.035),i))[i]);
    col*=1.-.26*smoothstep(0.,.12,sh);
  }
  if(onFloor&&burst<=0.){ vec4 b=balloons(q); col=mix(col,b.rgb,b.a*.92); }
  if(onFloor){
    col*=mix(.92,.6,smoothstep(0.,.5,fd));
    col+=vec3(.05,.055,.06)*smoothstep(.0,.5,fd);
  }
  col=mix(col,vec3(.02),smoothstep(.0035,.0,abs(mp.y-floorY)));
  col+=vec3(.7)*smoothstep(.0015,.0,abs(mp.y-floorY+.004));

  if(burst<=0.){ vec4 b=balloons(mp); col=mix(col,b.rgb,b.a); }

  col+=vec3(1.)*ring*.8;
  col+=vec3(1.,.96,.93)*smoothstep(.16,.0,burst)*step(.0001,burst)*1.2;
  float edge=ringAt*.86+(fbm(p*9.)-.5)*.28;
  float a=burst>0.?smoothstep(.0,.05,r-edge):1.;
  col=col/(1.+.06*col);
  o=vec4(pow(col,vec3(.93))*a,a);
}`;

// One mask per letter, in the display font. The graffiti A is narrow and would
// inflate into a 1: drawn wider, with less border so its counter stays open.
function drawGlyphs(W: number, H: number) {
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d", { willReadFrequently: true })!;
  const font = (px: number) => `${px}px "Urban Sign", Impact, sans-serif`;
  const stretch = (l: string) => (l === "A" ? 1.32 : 1);
  let size = Math.round(H * 0.78);
  g.font = font(size);
  const measure = () => [...LETTERS].map((l) => g.measureText(l).width * 1.04 * stretch(l));
  size = Math.floor(size * Math.min(1, (W * 0.93) / measure().reduce((a, b) => a + b)));
  g.font = font(size);
  g.textAlign = "center";
  g.textBaseline = "middle";
  const widths = measure();
  let x = (W - widths.reduce((a, b) => a + b)) / 2;
  const glyphs = widths.map((w, n) => {
    g.fillStyle = "#000"; g.fillRect(0, 0, W, H); g.fillStyle = "#fff";
    g.save(); g.translate(x + w / 2, H / 2 + H * 0.013); g.scale(stretch(LETTERS[n]), 1); g.fillText(LETTERS[n], 0, 0); g.restore();
    x += w;
    const px = g.getImageData(0, 0, W, H).data, mask = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) mask[i] = px[i * 4] > 127 ? 1 : 0;
    return mask;
  });
  return { glyphs, grow: [...LETTERS].map((l) => ((l === "A" ? 6 : 11) * W) / 1024) };
}

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, source);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
  return s;
}

// onBurst: the hero starts showing through the hole, so it has to be alive from here on.
export function mountBalloonLoader(overlayEl: HTMLElement, onDone: () => void, onBurst?: () => void): { setProgress: (p: number) => void } {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches && !document.documentElement.classList.contains("force-motion");
  const cv = document.createElement("canvas");
  const gl = reduced ? null : cv.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false });
  if (!gl) {
    onBurst?.();
    return mountSaosLoader(overlayEl, onDone);
  }

  let target = 0;
  let program: WebGLProgram;
  const loc: Record<string, WebGLUniformLocation | null> = {};
  try {
    program = gl.createProgram()!;
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.bindAttribLocation(program, 0, "a");
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error("link");
  } catch {
    onBurst?.();
    return mountSaosLoader(overlayEl, onDone);
  }

  overlayEl.classList.add("saos-intro");
  const fx = document.createElement("canvas");
  const gauge = document.createElement("div");
  cv.className = fx.className = "saos-balloon-layer";
  gauge.className = "saos-balloon-gauge";
  overlayEl.append(cv, fx, gauge);
  const ctx = fx.getContext("2d")!;

  gl.useProgram(program);
  for (const n of ["R", "C", "S", "A", "t", "press", "over", "burst", "floorY", "off", "F", "K"]) loc[n] = gl.getUniformLocation(program, n);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  // Empty until the worker answers: an unbound texture reads alpha 1, a full letter.
  for (const n of [0, 1]) {
    gl.activeTexture(gl.TEXTURE0 + n);
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
  }
  gl.uniform1i(loc.F, 0);
  gl.uniform1i(loc.K, 1);

  // Phones get a smaller field and fewer pixels; a slow GPU loses pixels on the way.
  const W = LITE ? 512 : 1024, H = W * 0.375;
  let resolution = LITE ? 1 : Math.min(devicePixelRatio || 1, 1.25);
  const aspect = W / H;
  let unit = 1, S0 = 1;
  const CY = 0.13;
  const layout = () => {
    const w = innerWidth, h = innerHeight;
    cv.width = Math.round(w * resolution); cv.height = Math.round(h * resolution);
    fx.width = cv.width; fx.height = cv.height;
    gl.viewport(0, 0, cv.width, cv.height);
    unit = Math.min(cv.height, cv.width * 0.62);
    S0 = Math.min(0.92, ((cv.width / unit) * 0.94) / aspect);
  };
  layout();
  addEventListener("resize", layout);

  let fieldStart = 0; // set once the shapes are there: the pump clock starts then
  let seeds: { u: number; v: number; i: number }[] = [];
  let worker: Worker | null = null;
  const prepare = async () => {
    await document.fonts.load('300px "Urban Sign"').catch(() => {});
    const { glyphs, grow } = drawGlyphs(W, H);
    worker = new Worker(new URL("./balloon-field.worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (e: MessageEvent<{ pillow: Float32Array; crease: Float32Array }>) => {
      [e.data.pillow, e.data.crease].forEach((data, n) => {
        gl.activeTexture(gl.TEXTURE0 + n);
        gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, W, H, 0, gl.RGBA, gl.FLOAT, data);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      });
      for (let guard = 0; seeds.length < (LITE ? 140 : 280) && guard < 300000; guard++) {
        const x = Math.floor(seeded(guard, 1) * W), y = Math.floor(seeded(guard, 2) * H);
        if (e.data.pillow[(y * W + x) * 4 + guard % 4] > 0.02) seeds.push({ u: x / W - 0.5, v: 0.5 - y / H, i: seeds.length });
      }
      fieldStart = performance.now();
      worker?.terminate();
    };
    // Never trap the visitor behind the mirror.
    worker.onerror = () => finish();
    worker.postMessage({ W, H, glyphs, grow, sweeps: LITE ? 130 : 260 }, glyphs.map((g) => g.buffer));
  };
  void prepare().catch(() => finish());

  let raf = 0, shown = 0, fullAt = 0, finished = false, burstSent = false, frames = 0, slow = 0, last = performance.now();
  function finish() {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(raf);
    removeEventListener("resize", layout);
    worker?.terminate();
    gl!.getExtension("WEBGL_lose_context")?.loseContext();
    onDone();
  }

  function shreds(S: number, dt: number) {
    ctx.clearRect(0, 0, fx.width, fx.height);
    if (dt <= 0) return;
    const u = unit, cx = fx.width / 2, cy = fx.height / 2;
    for (const s of seeds) {
      const x0 = s.u * aspect * S * u, y0 = (s.v * S + CY) * u;
      const a = seeded(s.i, 3) * Math.PI * 2, kick = (0.5 + seeded(s.i, 4) * 1.7) * u;
      const dirx = x0 / (u * 0.6) + Math.cos(a) * 0.9, diry = y0 / (u * 0.6) + Math.sin(a) * 0.9;
      const drag = (1 - Math.exp(-3.4 * dt)) / 3.4;
      const x = cx + x0 + dirx * kick * drag;
      const y = cy - y0 - diry * kick * drag + 0.34 * u * dt * dt;
      const size = (0.012 + seeded(s.i, 5) * 0.03) * u;
      const fade = clamp01(1 - (dt - (END_S - 0.7)) / 0.7);
      if (fade <= 0 || y > fx.height + size) continue;
      const flip = Math.cos((seeded(s.i, 7) * 2 - 1) * 11 * dt + a);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((seeded(s.i, 6) * 2 - 1) * 9 * dt + a);
      ctx.scale(1, 0.25 + 0.75 * Math.abs(flip));
      ctx.globalAlpha = fade;
      ctx.fillStyle = SHREDS[flip > 0.55 ? 1 : flip < -0.55 ? 2 : s.i % 2 ? 0 : 3];
      const j = (n: number) => seeded(s.i, n) * 0.6 + 0.4;
      ctx.beginPath();
      ctx.moveTo(-size * j(8), -size * 0.5 * j(9));
      ctx.lineTo(size * j(10), -size * 0.6 * j(11));
      ctx.lineTo(size * 0.7 * j(12), size * 0.7 * j(13));
      ctx.lineTo(-size * 0.6 * j(14), size * 0.5 * j(15));
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    // Slow GPU: fewer pixels instead of a stuttering pop.
    if (now - last > 45 && ++slow > 12 && resolution > 0.5) { resolution *= 0.7; slow = 0; layout(); }
    last = now;
    frames++;

    // The level follows the real progress but never outruns the pump strokes.
    if (fieldStart) shown = Math.max(shown, Math.min(target, pumped((now - fieldStart) / 1000)));
    if (shown >= 1 && !fullAt) fullAt = now;
    const sinceFull = fullAt ? (now - fullAt) / 1000 : 0;
    const over = clamp01(sinceFull / OVER_S);
    const dt = sinceFull - OVER_S;
    const burst = dt <= 0 ? 0 : clamp01(dt / BURST_S);
    if (dt > 0 && !burstSent) { burstSent = true; onBurst?.(); }
    if (dt >= END_S) return finish();

    const S = S0 * (0.8 + 0.2 * shown + 0.045 * over * over);
    const time = now / 1000;
    gl.uniform2f(loc.R, cv.width, cv.height);
    gl.uniform2f(loc.C, 0, CY);
    gl.uniform1f(loc.S, S);
    gl.uniform1f(loc.A, aspect);
    gl.uniform1f(loc.t, time);
    gl.uniform1f(loc.press, shown);
    gl.uniform1f(loc.over, over);
    gl.uniform1f(loc.burst, burst);
    gl.uniform1f(loc.floorY, CY - 0.44 * S0);
    // Each letter hangs on its own: a slow drift, a hard shake just before the pop.
    const shake = over * over * 0.012, offs: number[] = [];
    for (let i = 0; i < 4; i++) {
      offs.push(0.006 * Math.sin(time * 0.9 + i * 1.7) + shake * Math.sin(time * 61 + i * 3), 0.009 * Math.sin(time * 1.2 + i * 2.3) + shake * Math.cos(time * 53 + i * 5));
    }
    gl.uniform2fv(loc.off, offs);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    shreds(S, dt);
    gauge.textContent = dt > 0 ? "" : `${UI.introLoading} ${Math.round(shown * 100)} %`;
    gauge.hidden = dt > 0;
  };
  raf = requestAnimationFrame(frame);

  return { setProgress: (p) => { target = Math.max(target, p); } };
}
