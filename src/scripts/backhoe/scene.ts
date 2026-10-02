/**
 * Scroll-driven hero scene: a backhoe loader demonstrates its loader end,
 * drives up from the plains into Kumaon hill terrain, deploys stabilisers
 * and digs a trench at a road-works site. Everything is a pure function of
 * scroll progress p ∈ [0, 1], damped for smoothness.
 */
import {
  ACESFilmicToneMapping,
  BackSide,
  BoxGeometry,
  BufferAttribute,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  FogExp2,
  Group,
  HemisphereLight,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PCFShadowMap,
  Vector4,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  ShaderMaterial,
  Shape,
  ShapeGeometry,
  SphereGeometry,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { buildBackhoe, hoeIK, makeMaterials, type Pose } from './model';
import { Dust, Excavation, ground, makeForest, makeHeap, withHoles } from '../three/kit';

/* ------------------------------------------------------------------ */
/* Maths                                                               */
/* ------------------------------------------------------------------ */
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const sstep = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const D = Math.PI / 180;

/** Piecewise keyframe track with eased segments. keys: [t, ...values]. */
function track(keys: number[][], p: number): number[] {
  if (p <= keys[0][0]) return keys[0].slice(1);
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (p <= b[0]) {
      const t = ease((p - a[0]) / (b[0] - a[0]));
      return a.slice(1).map((v, j) => lerp(v, b[j + 1], t));
    }
  }
  return keys[keys.length - 1].slice(1);
}

function hash(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function vnoise(x: number, y: number) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return lerp(lerp(a, b, u), lerp(c, d, u), v);
}
function fbm(x: number, y: number, o = 4) {
  let s = 0, a = 0.5, f = 1;
  for (let i = 0; i < o; i++) { s += a * vnoise(x * f, y * f); f *= 2.03; a *= 0.5; }
  return s;
}

/* ------------------------------------------------------------------ */
/* Story timeline                                                      */
/* ------------------------------------------------------------------ */
export const SITE_X = 17; // where the machine stops to dig
const DIG_B = 5.4; // trench centre, metres behind the machine origin
const DIG_DEPTH = 1.0;

const driveKeys = [[0, 0], [0.36, 0], [0.62, SITE_X], [1, SITE_X]];
const xAt = (p: number) => track(driveKeys, p)[0];

export function poseAt(p: number): Pose {
  const x = xAt(p);
  const e = 0.004;
  const acc = (xAt(p + e) - 2 * x + xAt(p - e)) / (e * e);

  // Loader: travel → lower & scoop → carry → travel
  const [loaderLift, bucketWorld] = track(
    [
      [0, 0.16, 0.32],
      [0.17, 0.16, 0.32],
      [0.24, 0.0, -0.06],
      [0.28, 0.0, 0.42],
      [0.315, 0.5, 0.4],
      [0.335, 0.5, -0.6],
      [0.36, 0.16, 0.32],
      [1, 0.16, 0.32],
    ],
    p,
  );

  // Stabilisers deploy on arrival
  const stab = sstep(0.62, 0.67, p);

  // Backhoe: folded travel pose → unfold → two IK-driven passes into the trench → rest
  const lift = Math.max(0, stab - 0.82) / 0.18 * 0.05;
  let boom = 1.18, dipper = -2.72, hoeBucket = -1.7, swing = 0, hoeFill = 0;
  const ready = hoeIK(DIG_B + 1, 1, -1.2, lift);
  if (p > 0.66) {
    const u = sstep(0.66, 0.7, p);
    boom = lerp(1.18, ready.boom, u); dipper = lerp(-2.72, ready.dipper, u); hoeBucket = lerp(-1.7, ready.hoeBucket, u);
  }
  if (p > 0.7) {
    const k = Math.min(1.999, ((Math.min(p, 0.86) - 0.7) / 0.16) * 2), i = Math.floor(k), t = p >= 0.86 ? 1 : k - i;
    const d1 = ((i + 1) * DIG_DEPTH) / 2, d0 = (i * DIG_DEPTH) / 2;
    const [back, h, phi, sw, fill] = track([
      [0.0, DIG_B + 1.0, 1.0, -1.2, 0, 0],
      [0.16, DIG_B + 1.05, -d0 + 0.05, -1.35, 0, 0],
      [0.44, DIG_B - 0.85, -d1, -2.45, 0, 0.6],
      [0.56, DIG_B - 0.7, 0.9, -3.05, 0, 1],
      [0.7, DIG_B - 0.1, 1.9, -3.05, 0.85, 1],
      [0.83, DIG_B - 0.1, 1.9, -0.25, 0.85, 0],
      [1.0, DIG_B + 1.0, 1.0, -1.2, 0, 0],
    ], t);
    ({ boom, dipper, hoeBucket } = hoeIK(back, h, phi, lift));
    swing = sw; hoeFill = fill;
  }
  const rest = sstep(0.88, 0.95, p);
  if (rest > 0) {
    const r = hoeIK(DIG_B - 0.6, 1.6, -2.6, lift);
    boom = lerp(boom, r.boom, rest); dipper = lerp(dipper, r.dipper, rest); hoeBucket = lerp(hoeBucket, r.hoeBucket, rest); swing = lerp(swing, 0.1, rest);
  }
  const loaderFill = sstep(0.27, 0.29, p) * (1 - sstep(0.325, 0.34, p));

  return { x, loaderLift, bucketWorld, loaderFill, boom, dipper, hoeBucket, swing, hoeFill, stab, pitch: clamp(-acc * 0.00004, -0.02, 0.02) };
}

/** Trench depth reached by pass i at progress p (the pit is exactly where the bucket has been). */
export function trenchDepth(p: number) {
  if (p <= 0.7) return 0;
  if (p >= 0.86) return DIG_DEPTH;
  const k = ((p - 0.7) / 0.16) * 2, i = Math.floor(k), t = k - i;
  return lerp((i * DIG_DEPTH) / 2, ((i + 1) * DIG_DEPTH) / 2, sstep(0.16, 0.44, t));
}

interface Cam { az: number; el: number; dist: number; ty: number; tx: number }
function camAt(p: number, mobile: boolean): Cam {
  const [az, el, dist, ty, tx] = track(
    [
      [0, 34, 10, 15.5, 1.5, 0.0],
      [0.14, 48, 9, 14.5, 1.45, 0.2],
      [0.27, 78, 5, 12.0, 1.2, 0.6],
      [0.38, 96, 3, 14, 2.4, 0.2],
      [0.54, 112, 3, 24, 5.2, 0.4],
      [0.66, 144, 5, 16, 3.4, -1.6],
      [0.86, 154, 7, 16.5, 3.0, -2.2],
      [1, 118, 4, 31, 6.2, -1.5],
    ],
    p,
  );
  return { az, el, dist: mobile ? dist * 1.5 : dist, ty, tx };
}

/* ------------------------------------------------------------------ */
/* Environment                                                         */
/* ------------------------------------------------------------------ */
/** Terrain height: flat road corridor, hills rising behind, valley in front; steeper as we drive into the hills. */
export function heightAt(x: number, z: number) {
  const hill = sstep(-8, 20, x);
  if (z < -4) {
    const d = -4 - z;
    const cut = sstep(4, 26, x) * (1 - sstep(52, 72, x));
    // fresh vertical-ish road cut, then a forested slope that rolls over into a ridge
    const cutH = cut * sstep(0.2, 3.2, d) * 5.2;
    // forested bank that rolls over into a crest ~30–40 m back, so the distant ranges read above it
    const slope = lerp(2.5, 7, hill) * (1 - Math.exp(-d / 11));
    return cutH + slope + fbm(x * 0.05, z * 0.05) * Math.min(d, 20) * 0.22 * (0.4 + hill);
  }
  if (z > 4.2) {
    const d = z - 4.2;
    return -lerp(0.3, 9, hill) * (1 - Math.exp(-d / 14)) + fbm(x * 0.07, z * 0.07) * Math.min(d, 6) * 0.25;
  }
  return 0;
}

function makeGround(quality: number) {
  const W = 220, H = 150;
  const seg = quality > 0.6 ? 1 : 1.6;
  const g = new PlaneGeometry(W, H, Math.round(W / seg), Math.round(H / seg));
  g.rotateX(-Math.PI / 2);
  g.translate(40, 0, -30);
  const pos = g.attributes.position as BufferAttribute;
  const col = new Float32Array(pos.count * 3);
  const c = new Color();
  const plains = new Color('#5a5045'), veg = new Color('#3b4535'), vegDark = new Color('#29332a'),
    cutA = new Color('#8a6a4b'), cutB = new Color('#5b4a3c'), rock = new Color('#7d7a73'), shoulder = new Color('#62594d');
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const h = heightAt(x, z);
    pos.setY(i, h - 0.02);
    const n = fbm(x * 0.15, z * 0.15, 3);
    const hillness = sstep(-6, 18, x);
    if (Math.abs(z) <= 4.4) c.copy(shoulder).lerp(plains, n * 0.6);
    else c.copy(plains).lerp(n > 0.5 ? veg : vegDark, hillness * 0.85);
    // freshly cut slope face: banded strata
    if (z < -4 && z > -9) {
      const cutMask = sstep(4, 26, x) * (1 - sstep(52, 72, x)) * sstep(-4.2, -4.8, z) * (1 - sstep(-7.2, -8.4, z));
      const band = (Math.sin(h * 5.5 + n * 3) + 1) / 2;
      const strata = c.clone().copy(cutA).lerp(cutB, band).lerp(rock, n > 0.62 ? 0.6 : 0);
      c.lerp(strata, cutMask);
    }
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new BufferAttribute(col, 3));
  g.computeVertexNormals();
  const m = new Mesh(g, ground([TRENCH_HOLE]));
  m.receiveShadow = true;
  return m;
}

/** Opening cut in the ground and road for the trench; sized when digging starts. */
const TRENCH_HOLE = new Vector4(SITE_X - DIG_B, 0, -1, -1);

function makeRoad() {
  const grp = new Group();
  const road = new Mesh(new PlaneGeometry(220, 6.2, 1, 1), withHoles(new MeshStandardMaterial({ color: '#3d3b38', roughness: 0.95 }), [TRENCH_HOLE]));
  road.rotation.x = -Math.PI / 2;
  road.position.set(40, 0.004, 0);
  road.receiveShadow = true;
  grp.add(road);
  // worn edge lines (only where the road becomes a proper hill road)
  for (const z of [-2.85, 2.85]) {
    const l = new Mesh(new PlaneGeometry(120, 0.1), new MeshStandardMaterial({ color: '#b9b3a8', roughness: 0.9 }));
    l.rotation.x = -Math.PI / 2;
    l.position.set(70, 0.008, z);
    l.receiveShadow = true;
    grp.add(l);
  }
  // valley-side parapet blocks on the hill section
  const pg = new BoxGeometry(0.9, 0.55, 0.32);
  const pm = new MeshStandardMaterial({ color: '#c9c4ba', roughness: 0.85 });
  const n = 40;
  const par = new InstancedMesh(pg, pm, n);
  const o = new Object3D();
  for (let i = 0; i < n; i++) {
    o.position.set(24 + i * 2.6, 0.27, 3.55);
    o.updateMatrix();
    par.setMatrixAt(i, o.matrix);
  }
  par.castShadow = true;
  par.receiveShadow = true;
  grp.add(par);
  return grp;
}

/** Distant Kumaon ridgelines as layered silhouettes (atmospheric perspective). */
function makeRidges() {
  const grp = new Group();
  const layers = [
    { z: -150, base: 22, amp: 46, col: '#263033', freq: 0.013, snow: false },
    { z: -240, base: 40, amp: 64, col: '#323d45', freq: 0.009, snow: false },
    { z: -350, base: 66, amp: 80, col: '#45515b', freq: 0.007, snow: false },
    { z: -560, base: 110, amp: 150, col: '#67727d', freq: 0.0042, snow: true },
  ];
  const mats: MeshBasicMaterial[] = [];
  layers.forEach((L, li) => {
    const s = new Shape();
    const W = 1600, N = 220;
    s.moveTo(-W / 2, -60);
    const tops: number[] = [];
    for (let i = 0; i <= N; i++) {
      const x = -W / 2 + (W * i) / N;
      let y = L.base + fbm(x * L.freq + li * 13.1, li * 7.7, 5) * L.amp;
      if (L.snow) y += Math.pow(Math.max(0, fbm(x * 0.006 + 4, 2.2, 3) - 0.48), 1.6) * 520;
      tops.push(y);
      s.lineTo(x, y);
    }
    s.lineTo(W / 2, -60);
    s.closePath();
    const g = new ShapeGeometry(s);
    // vertical tint: lighter at the crest, snow on the far range
    const pos = g.attributes.position as BufferAttribute;
    const col = new Float32Array(pos.count * 3);
    const base = new Color(L.col), crest = new Color(L.col).lerp(new Color('#8b939b'), 0.18), snow = new Color('#c9cfd4');
    const c = new Color();
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      c.copy(base).lerp(crest, clamp((y + 20) / (L.base + L.amp + 40)));
      if (L.snow && y > 240) c.lerp(snow, clamp((y - 240) / 70) * 0.85);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new BufferAttribute(col, 3));
    const m = new MeshBasicMaterial({ vertexColors: true, fog: false, transparent: true, opacity: 0, depthWrite: false });
    mats.push(m);
    const mesh = new Mesh(g, m);
    mesh.position.set(60, 10, L.z);
    mesh.renderOrder = -10 + li * -1;
    grp.add(mesh);
  });
  return { grp, mats };
}

function makeSky() {
  const m = new ShaderMaterial({
    side: BackSide,
    depthWrite: false,
    fog: false,
    uniforms: { uReveal: { value: 0 } },
    vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
      varying vec3 vP; uniform float uReveal;
      void main(){
        float y = vP.y;
        vec3 top = vec3(0.055,0.067,0.078);
        vec3 hor = mix(vec3(0.11,0.125,0.137), vec3(0.30,0.33,0.36), uReveal);
        vec3 warm = vec3(0.62,0.40,0.26);
        float glow = pow(clamp(1.0 - abs(y - 0.02) * 6.0, 0.0, 1.0), 2.0) * smoothstep(-0.2, 0.9, vP.x) * uReveal;
        vec3 c = mix(hor, top, smoothstep(-0.02, 0.45, y));
        c = mix(c, warm, glow * 0.3);
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const s = new Mesh(new SphereGeometry(900, 32, 16), m);
  return { mesh: s, mat: m };
}

function makeSiteProps() {
  const g = new Group();
  const cone = new ConeGeometry(0.17, 0.62, 14);
  cone.translate(0, 0.31, 0);
  const coneM = new MeshStandardMaterial({ color: '#d0702f', roughness: 0.6 });
  const band = new MeshStandardMaterial({ color: '#e9e5dc', roughness: 0.5 });
  const cones: [number, number][] = [[SITE_X - 8.4, 1.9], [SITE_X - 7.2, 2.3], [SITE_X - 5.6, 2.5], [SITE_X - 3.9, 2.5], [SITE_X - 8.8, 0.6]];
  for (const [x, z] of cones) {
    const c = new Mesh(cone, coneM);
    c.position.set(x, 0, z);
    c.castShadow = true;
    g.add(c);
    const b = new Mesh(new CylinderGeometry(0.1, 0.12, 0.09, 14), band);
    b.position.set(x, 0.38, z);
    g.add(b);
    const base = new Mesh(new BoxGeometry(0.4, 0.04, 0.4), new MeshStandardMaterial({ color: '#1b1b1b' }));
    base.position.set(x, 0.02, z);
    g.add(base);
  }
  // stacked RCC drainage pipes waiting to go into the trench
  const pipeOuter = new CylinderGeometry(0.5, 0.5, 2.4, 28, 1, true);
  pipeOuter.rotateX(Math.PI / 2);
  const concrete = new MeshStandardMaterial({ color: '#9d978d', roughness: 0.95, side: DoubleSide });
  const pipes: [number, number, number][] = [[SITE_X + 2.5, 0.5, -3.1], [SITE_X + 3.55, 0.5, -3.1], [SITE_X + 3.02, 1.38, -3.1]];
  for (const [x, y, z] of pipes) {
    const p = new Mesh(pipeOuter, concrete);
    p.position.set(x, y, z);
    p.rotation.y = Math.PI / 2;
    p.castShadow = true;
    p.receiveShadow = true;
    g.add(p);
  }
  // barricade board
  const board = new Mesh(new BoxGeometry(2.2, 0.32, 0.05), new MeshStandardMaterial({ color: '#d9d4c9', roughness: 0.7 }));
  board.position.set(SITE_X + 6, 0.9, 2.5);
  board.castShadow = true;
  g.add(board);
  for (let i = 0; i < 4; i++) {
    const s = new Mesh(new BoxGeometry(0.22, 0.33, 0.055), coneM);
    s.position.set(SITE_X + 5.2 + i * 0.55, 0.9, 2.5);
    s.rotation.z = 0.5;
    g.add(s);
  }
  for (const dx of [-0.95, 0.95]) {
    const leg = new Mesh(new BoxGeometry(0.06, 0.95, 0.06), new MeshStandardMaterial({ color: '#2a2d30' }));
    leg.position.set(SITE_X + 6 + dx, 0.47, 2.5);
    g.add(leg);
  }
  return g;
}

/* ------------------------------------------------------------------ */
/* Scene controller                                                    */
/* ------------------------------------------------------------------ */
export interface HeroScene {
  setProgress(p: number): void;
  resize(): void;
  start(): void;
  stop(): void;
  dispose(): void;
  onFrame?: (p: number, pose: Pose) => void;
}

/** Hand the main thread back between build phases so input and paint are never blocked for long. */
function yieldToMain(): Promise<void> {
  const sch = (globalThis as { scheduler?: { yield?: () => Promise<void> } }).scheduler;
  if (sch?.yield) return sch.yield();
  return new Promise((r) => setTimeout(r, 0));
}

export async function createScene(canvas: HTMLCanvasElement, opts: { mobile: boolean; reduced: boolean }): Promise<HeroScene> {
  const { mobile, reduced } = opts;
  const quality = mobile ? 0.5 : 1;
  const instant = /[?&]instant\b/.test(location.search); // for automated visual checks
  const renderer = new WebGLRenderer({ canvas, antialias: !mobile || devicePixelRatio < 2, powerPreference: 'high-performance', alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 1.75));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;

  const scene = new Scene();
  scene.background = new Color('#14181b');
  const fog = new FogExp2('#1b2023', 0.05);
  scene.fog = fog;

  const pmrem = new PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = env;
  (scene as unknown as { environmentIntensity: number }).environmentIntensity = 0.32;
  await yieldToMain();

  const camera = new PerspectiveCamera(mobile ? 44 : 36, 1, 0.1, 2000);

  // Lights: low warm sun, cool sky fill, cold rim from the hills
  const hemi = new HemisphereLight('#a9b8c6', '#3b3129', 0.55);
  scene.add(hemi);
  const sun = new DirectionalLight('#ffd6ab', 2.7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
  sun.shadow.camera.left = -9; sun.shadow.camera.right = 9; sun.shadow.camera.top = 9; sun.shadow.camera.bottom = -9;
  sun.shadow.camera.near = 1; sun.shadow.camera.far = 40;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  scene.add(sun, sun.target);
  const rim = new DirectionalLight('#9db4cc', 1.25);
  scene.add(rim, rim.target);

  const sky = makeSky();
  scene.add(sky.mesh);
  const ridges = makeRidges();
  scene.add(ridges.grp);
  await yieldToMain();
  scene.add(makeGround(quality));
  scene.add(makeRoad());
  await yieldToMain();
  scene.add(makeForest(mobile ? 320 : 900, (i) => {
    const x = -50 + hash(i, 3) * 200, z = -9.5 - hash(i, 7) * 45;
    if (fbm(x * 0.05, z * 0.05) + sstep(-10, 20, x) * 0.25 < 0.5) return null;
    return [x, heightAt(x, z), z, 1.1 + hash(i, 11) * 1.3];
  }, { broad: 0.12 }));
  scene.add(makeSiteProps());
  await yieldToMain();

  // Trench + spoil pile grow as the backhoe works; a stockpile for the loader
  const trench = new Excavation(2.4, 0.8, DIG_DEPTH, '#6e5643', '#4b3c2e');
  trench.grp.position.set(SITE_X - DIG_B, 0, 0);
  scene.add(trench.grp);
  const spoil = makeHeap('#6a5442', 3, 0.6);
  scene.add(spoil);
  const stock = makeHeap('#6d5441', 2, 0.55);
  scene.add(stock);
  const dust = new Dust(mobile ? 120 : 200);
  scene.add(dust.points);

  const mats = makeMaterials();
  const machine = buildBackhoe(mats);
  scene.add(machine.root);
  // place the stockpile at the lowered loader bucket, the spoil where the backhoe dumps
  machine.apply(poseAt(0.26));
  const edge = machine.loaderEdge();
  stock.position.set(edge.x + 1.15, 0, 0);
  machine.apply({ ...poseAt(0.83), ...hoeIK(DIG_B - 0.1, 1.9, -0.25, 0.05), swing: 0.85 });
  const dumpAt = machine.hoeTip();
  spoil.position.set(dumpAt.x, 0, dumpAt.z);
  await yieldToMain();

  const hazeCol = new Color('#46505a');
  let target = 0;
  let current = 0;
  let raf = 0;
  let running = false;
  let last = performance.now();
  const t0 = last;
  let dirty = true;
  let lastDust = performance.now(), lastP = -1, lastDepth = 0;
  const tmp = new Vector3();
  const api: HeroScene = {
    setProgress(p) { target = clamp(p); dirty = true; },
    resize,
    start() { if (!running) { running = true; last = performance.now(); raf = requestAnimationFrame(loop); } },
    stop() { running = false; cancelAnimationFrame(raf); },
    dispose() { api.stop(); renderer.dispose(); pmrem.dispose(); },
  };

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Frame the machine beside the copy: right of centre on desktop, upper half on mobile.
    if (mobile) camera.setViewOffset(w, h, 0, h * 0.26, w, h);
    else camera.setViewOffset(w, h, -w * 0.17, h * 0.03, w, h);
    camera.updateProjectionMatrix();
    dirty = true;
  }

  function frame(now: number) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const k = reduced || instant ? 1 : 1 - Math.exp(-dt * 5.5);
    const prev = current;
    current += (target - current) * k;
    if (Math.abs(target - current) < 1e-5) current = target;
    const intro = reduced || instant ? 1 : ease(clamp((now - t0) / 1700));
    const idle = !mobile && !reduced && current < 0.03;
    if (!dirty && prev === current && intro >= 1 && !idle) return;
    dirty = false;

    const p = current;
    const pose = poseAt(p);
    machine.apply(pose);

    // trench & spoil follow the bucket; stockpile is crowded then topped back up
    const depth = trenchDepth(p);
    trench.set(depth);
    TRENCH_HOLE.z = depth > 0.004 ? 1.2 : -1; TRENCH_HOLE.w = depth > 0.004 ? 0.4 : -1;
    const f = depth / DIG_DEPTH;
    spoil.visible = f > 0.03;
    spoil.scale.set(0.5 + f * 0.9, 0.35 + f * 0.5, 0.5 + f * 0.8);
    const sp = 1 - sstep(0.25, 0.28, p) * 0.18 + sstep(0.335, 0.35, p) * 0.18;
    stock.scale.set(1.5 * sp, 0.9 * sp, 1.6 * sp);
    stock.visible = p < 0.62;
    // dust where the bucket bites or dumps
    const dtS = Math.min(0.05, (now - lastDust) / 1000);
    lastDust = now;
    if (Math.abs(p - lastP) > 1e-5) {
      const tp = machine.hoeTip();
      if (depth > lastDepth + 1e-4) dust.emit(tp.x, 0.05, tp.z, 2, 0.5, 0.5, 1.0);
      if (p > 0.325 && p < 0.345) { const e = machine.loaderEdge(); dust.emit(e.x, 1.4, e.z, 3, 0.9, -0.2, 1.4); }
      if (p > 0.25 && p < 0.28) { const e = machine.loaderEdge(); dust.emit(e.x + 0.3, 0.2, e.z, 2, 0.7, 0.4, 1.2); }
    }
    lastP = p; lastDepth = depth;
    dust.step(dtS);
    if (dust.alive > 0) dirty = true;

    // atmosphere: from a dark studio moment to open hill country
    const reveal = sstep(0.3, 0.6, p);
    fog.density = lerp(0.055, 0.0105, reveal);
    fog.color.set('#1b2023').lerp(hazeCol, reveal);
    scene.background = fog.color;
    sky.mat.uniforms.uReveal.value = reveal;
    ridges.mats.forEach((m, i) => (m.opacity = sstep(0.28 + i * 0.05, 0.56 + i * 0.05, p)));
    hemi.intensity = lerp(0.45, 0.75, reveal);

    // camera
    const c = camAt(p, mobile);
    let az = c.az;
    if (idle) az += Math.sin((now - t0) / 4200) * 3;
    const dist = c.dist + (1 - intro) * 5;
    const tx = pose.x + c.tx;
    const ty = c.ty;
    camera.position.set(
      tx + Math.cos(c.el * D) * Math.cos(az * D) * dist,
      ty + Math.sin(c.el * D) * dist,
      Math.sin(az * D) * Math.cos(c.el * D) * dist,
    );
    camera.lookAt(tmp.set(tx, ty, 0));
    renderer.toneMappingExposure = lerp(0.2, 1.02, intro);

    sun.position.set(pose.x + 9, 11, 7);
    sun.target.position.set(pose.x - 1, 0, 0);
    rim.position.set(pose.x - 8, 5, -9);
    rim.target.position.set(pose.x, 1, 0);

    renderer.render(scene, camera);
    api.onFrame?.(p, pose);
  }

  function loop(now: number) {
    if (!running) return;
    frame(now);
    raf = requestAnimationFrame(loop);
  }

  resize();
  // Compile shaders off the main thread where the driver supports it (KHR_parallel_shader_compile),
  // so the first rendered frame does not stall the page.
  try {
    await renderer.compileAsync(scene, camera);
  } catch {
    /* fall back to compiling on first render */
  }
  if (reduced) frame(performance.now());
  return api;
}
