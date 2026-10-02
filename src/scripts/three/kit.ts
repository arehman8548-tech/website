/**
 * Shared building blocks for every page scene: maths, renderer setup, sky,
 * lighting, terrain material, vegetation, rocks, dust, excavations and site
 * props. Everything is procedural and built at real-world scale (metres).
 */
import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  BackSide,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  HemisphereLight,
  IcosahedronGeometry,
  InstancedBufferAttribute,
  InstancedMesh,
  Material,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  NormalBlending,
  Object3D,
  PCFShadowMap,
  PlaneGeometry,
  PMREMGenerator,
  Points,
  Scene,
  ShaderMaterial,
  Shape,
  ShapeGeometry,
  SphereGeometry,
  SRGBColorSpace,
  Vector3,
  Vector4,
  WebGLRenderer,
  type Path,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/* ------------------------------------------------------------------ */
/* Maths                                                               */
/* ------------------------------------------------------------------ */
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const sstep = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeIO = (t: number) => t * t * (3 - 2 * t);
export const D = Math.PI / 180;
/** Remap p from [a,b] to [0,1], clamped. */
export const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a));

/** Piecewise keyframe track with eased segments. keys: [t, ...values]. */
export function track(keys: number[][], p: number, fn = ease): number[] {
  if (p <= keys[0][0]) return keys[0].slice(1);
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (p <= b[0]) {
      const t = fn((p - a[0]) / (b[0] - a[0] || 1));
      return a.slice(1).map((v, j) => lerp(v, b[j + 1], t));
    }
  }
  return keys[keys.length - 1].slice(1);
}

export function hash(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
export function vnoise(x: number, y: number) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return lerp(lerp(a, b, u), lerp(c, d, u), v);
}
export function fbm(x: number, y: number, o = 4) {
  let s = 0, a = 0.5, f = 1;
  for (let i = 0; i < o; i++) { s += a * vnoise(x * f, y * f); f *= 2.03; a *= 0.5; }
  return s;
}
/** Deterministic PRNG. */
export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

export function yieldToMain(): Promise<void> {
  const sch = (globalThis as { scheduler?: { yield?: () => Promise<void> } }).scheduler;
  if (sch?.yield) return sch.yield();
  return new Promise((r) => setTimeout(r, 0));
}

/* ------------------------------------------------------------------ */
/* Renderer + scene                                                    */
/* ------------------------------------------------------------------ */
export interface Ctx { mobile: boolean; reduced: boolean; instant: boolean; lite?: boolean; capture?: boolean }

export function createRenderer(canvas: HTMLCanvasElement, ctx: Ctx, opts: { shadows?: boolean; envIntensity?: number } = {}) {
  const renderer = new WebGLRenderer({ canvas, antialias: !ctx.mobile || devicePixelRatio < 2, powerPreference: 'high-performance', alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, ctx.mobile ? 1.5 : 1.75));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = opts.shadows !== false;
  renderer.shadowMap.type = PCFShadowMap;
  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = env;
  (scene as unknown as { environmentIntensity: number }).environmentIntensity = opts.envIntensity ?? 0.3;
  const dispose = () => {
    scene.traverse((o) => {
      const m = o as Mesh;
      if (m.geometry) m.geometry.dispose();
      const mat = m.material as Material | Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else mat?.dispose();
    });
    pmrem.dispose();
    env.dispose();
    renderer.dispose();
  };
  return { renderer, scene, dispose };
}

/** Low warm sun with a soft shadow frustum that can follow the action, cool sky fill and a cold rim. */
export function makeLights(scene: Scene, ctx: Ctx, o: { sun?: string; sunI?: number; sky?: string; ground?: string; hemiI?: number; extent?: number; far?: number } = {}) {
  const hemi = new HemisphereLight(o.sky ?? '#a9b8c6', o.ground ?? '#3b3129', o.hemiI ?? 0.6);
  scene.add(hemi);
  const sun = new DirectionalLight(o.sun ?? '#ffd6ab', o.sunI ?? 2.6);
  sun.castShadow = true;
  const S = ctx.mobile ? 1024 : 2048;
  sun.shadow.mapSize.set(S, S);
  const e = o.extent ?? 12;
  Object.assign(sun.shadow.camera, { left: -e, right: e, top: e, bottom: -e, near: 1, far: o.far ?? 80 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  sun.shadow.radius = 3;
  scene.add(sun, sun.target);
  const rim = new DirectionalLight('#9db4cc', 1.1);
  scene.add(rim, rim.target);
  const off = new Vector3(9, 12, 7);
  return {
    hemi,
    sun,
    rim,
    /** Keep the shadow frustum centred on the action. dir = sun offset from target. */
    follow(x: number, y: number, z: number, dir: Vector3 = off) {
      sun.position.set(x + dir.x, y + dir.y, z + dir.z);
      sun.target.position.set(x, y, z);
      rim.position.set(x - 8, y + 5, z - 9);
      rim.target.position.set(x, y + 1, z);
    },
  };
}

/** Gradient sky dome with a horizon haze band and a sun glow. */
export function makeSky(o: { top?: string; horizon?: string; glow?: string; sunDir?: Vector3; radius?: number } = {}) {
  const m = new ShaderMaterial({
    side: BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      uTop: { value: new Color(o.top ?? '#0e1114') },
      uHor: { value: new Color(o.horizon ?? '#4a545d') },
      uGlow: { value: new Color(o.glow ?? '#9e6642') },
      uSun: { value: (o.sunDir ?? new Vector3(0.6, 0.12, 0.4)).clone().normalize() },
      uGlowAmt: { value: 0.35 },
    },
    vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
      varying vec3 vP; uniform vec3 uTop, uHor, uGlow, uSun; uniform float uGlowAmt;
      void main(){
        float y = vP.y;
        vec3 c = mix(uHor, uTop, smoothstep(-0.02, 0.5, y));
        float s = max(dot(normalize(vP), uSun), 0.0);
        float band = exp(-abs(y - 0.02) * 9.0);
        c += uGlow * (pow(s, 8.0) * 0.6 + band * pow(s, 2.0) * 0.5) * uGlowAmt;
        c = mix(c, uHor * 0.9, smoothstep(0.0, -0.2, y));
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new Mesh(new SphereGeometry(o.radius ?? 1800, 32, 16), m);
  mesh.renderOrder = -100;
  return { mesh, mat: m };
}

/** Distant mountain ranges as layered silhouettes with atmospheric perspective. */
export function makeRidges(o: { layers?: { z: number; base: number; amp: number; col: string; freq: number; snow?: boolean }[]; x?: number; seed?: number } = {}) {
  const grp = new Group();
  const layers = o.layers ?? [
    { z: -150, base: 22, amp: 46, col: '#263033', freq: 0.013 },
    { z: -240, base: 40, amp: 64, col: '#323d45', freq: 0.009 },
    { z: -350, base: 66, amp: 80, col: '#45515b', freq: 0.007 },
    { z: -560, base: 110, amp: 150, col: '#67727d', freq: 0.0042, snow: true },
  ];
  const seed = o.seed ?? 0;
  const mats: MeshBasicMaterial[] = [];
  layers.forEach((L, li) => {
    const s = new Shape();
    const W = 1800, N = 240;
    s.moveTo(-W / 2, -80);
    for (let i = 0; i <= N; i++) {
      const x = -W / 2 + (W * i) / N;
      let y = L.base + fbm(x * L.freq + li * 13.1 + seed, li * 7.7 + seed, 5) * L.amp;
      if (L.snow) y += Math.pow(Math.max(0, fbm(x * 0.006 + 4 + seed, 2.2, 3) - 0.48), 1.6) * 520;
      s.lineTo(x, y);
    }
    s.lineTo(W / 2, -80);
    s.closePath();
    const g = new ShapeGeometry(s);
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
    const m = new MeshBasicMaterial({ vertexColors: true, fog: false, transparent: true, opacity: 1, depthWrite: false });
    mats.push(m);
    const mesh = new Mesh(g, m);
    mesh.position.set(o.x ?? 0, 6, L.z);
    mesh.renderOrder = -10 - li;
    grp.add(mesh);
  });
  return { grp, mats };
}

/* ------------------------------------------------------------------ */
/* Procedural surface detail                                           */
/* ------------------------------------------------------------------ */
const GLSL_NOISE = `
  float kHash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float kNoise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.0-2.0*f);
    return mix(mix(kHash(i), kHash(i+vec2(1,0)), u.x), mix(kHash(i+vec2(0,1)), kHash(i+vec2(1,1)), u.x), u.y); }
  float kFbm(vec2 p){ float s = 0.0, a = 0.5; for(int i=0;i<4;i++){ s += a*kNoise(p); p *= 2.07; a *= 0.5; } return s; }
`;

/**
 * Adds world-space grain to any standard material: soil clods, gravel and
 * colour breakup so large surfaces never read as flat plastic.
 * strength ≈ 0.25 for soil, 0.12 for paint/concrete.
 */
export function addGrain<T extends MeshStandardMaterial>(m: T, o: { scale?: number; strength?: number; rough?: number } = {}): T {
  const scale = o.scale ?? 1.6, strength = o.strength ?? 0.26, rough = o.rough ?? 0.12;
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vKWP;\nvarying vec3 vKWN;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        #ifdef USE_INSTANCING
          vKWP = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
        #else
          vKWP = (modelMatrix * vec4(transformed, 1.0)).xyz;
        #endif
        vKWN = normalize(mat3(modelMatrix) * objectNormal);`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vKWP;\nvarying vec3 vKWN;\n${GLSL_NOISE}`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        // pick the projection that faces the surface, so steep cut faces get grain, not streaks
        vec3 kan = abs(vKWN);
        vec2 kp = kan.y > 0.55 ? vKWP.xz : (kan.x > kan.z ? vKWP.zy * vec2(1.0, 1.6) : vKWP.xy * vec2(1.0, 1.6));
        float kg = kFbm(kp * ${scale.toFixed(3)}) * 0.65 + kNoise(kp * ${(scale * 9).toFixed(3)}) * 0.35;
        float kl = kFbm(kp * ${(scale * 0.07).toFixed(4)});
        diffuseColor.rgb *= 1.0 + (kg - 0.5) * ${(strength * 2).toFixed(3)} + (kl - 0.5) * ${(strength * 1.2).toFixed(3)};`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = clamp(roughnessFactor + (kg - 0.5) * ${rough.toFixed(3)}, 0.04, 1.0);`);
  };
  m.customProgramCacheKey = () => `grain${scale}${strength}${rough}`;
  return m;
}

export const soil = (c: string, o?: { scale?: number; strength?: number }) => addGrain(new MeshStandardMaterial({ color: c, roughness: 1, metalness: 0 }), o);
/**
 * Vertex-coloured terrain material. holes: up to 4 rectangles [cx, cz, halfW, halfL]
 * (world XZ) where the surface is cut away so excavations below show through.
 */
export function ground(holes: Vector4[] = []) {
  const m = addGrain(new MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 }), { scale: 1.2, strength: 0.3 });
  return holes.length ? withHoles(m, holes) : m;
}

/** Cut rectangular holes [cx, cz, halfW, halfL] (world XZ) out of any grain/standard material. */
export function withHoles<T extends MeshStandardMaterial>(m: T, holes: Vector4[]): T {
  if (!m.onBeforeCompile.toString().includes('vKWP')) addGrain(m, { strength: 0 });
  const base = m.onBeforeCompile;
  const uHoles = { value: [...holes, ...Array.from({ length: 4 - holes.length }, () => new Vector4(0, 0, -1, -1))].slice(0, 4) };
  m.onBeforeCompile = (sh, r) => {
    base(sh, r);
    sh.uniforms.uHoles = uHoles;
    sh.fragmentShader = sh.fragmentShader
      .replace('varying vec3 vKWP;', 'varying vec3 vKWP;\nuniform vec4 uHoles[4];')
      .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
        for (int i = 0; i < 4; i++) { vec4 h = uHoles[i]; if (abs(vKWP.x - h.x) < h.z && abs(vKWP.z - h.y) < h.w) discard; }`);
  };
  const key = m.customProgramCacheKey();
  m.customProgramCacheKey = () => key + 'holes';
  m.userData.holes = uHoles.value;
  return m;
}

/* ------------------------------------------------------------------ */
/* Heightfield                                                         */
/* ------------------------------------------------------------------ */
export function heightfield(
  o: { w: number; d: number; cx?: number; cz?: number; res: number },
  heightAt: (x: number, z: number) => number,
  colorAt: (x: number, z: number, h: number, slope: number, out: Color) => void,
  mat: Material = ground(),
) {
  const sx = Math.max(2, Math.round(o.w / o.res)), sz = Math.max(2, Math.round(o.d / o.res));
  const g = new PlaneGeometry(o.w, o.d, sx, sz);
  g.rotateX(-Math.PI / 2);
  g.translate(o.cx ?? 0, 0, o.cz ?? 0);
  const pos = g.attributes.position as BufferAttribute;
  for (let i = 0; i < pos.count; i++) pos.setY(i, heightAt(pos.getX(i), pos.getZ(i)));
  g.computeVertexNormals();
  const nrm = g.attributes.normal as BufferAttribute;
  const col = new Float32Array(pos.count * 3);
  const c = new Color();
  for (let i = 0; i < pos.count; i++) {
    colorAt(pos.getX(i), pos.getZ(i), pos.getY(i), 1 - nrm.getY(i), c);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new BufferAttribute(col, 3));
  const m = new Mesh(g, mat);
  m.receiveShadow = true;
  return m;
}

/* ------------------------------------------------------------------ */
/* Vegetation                                                          */
/* ------------------------------------------------------------------ */
function vcolor(g: BufferGeometry, f: (y: number, x: number, z: number) => [number, number, number]) {
  const p = g.attributes.position as BufferAttribute;
  const c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const [r, gg, b] = f(p.getY(i), p.getX(i), p.getZ(i));
    c[i * 3] = r; c[i * 3 + 1] = gg; c[i * 3 + 2] = b;
  }
  g.setAttribute('color', new BufferAttribute(c, 3));
  return g;
}

const ni = (g: BufferGeometry) => (g.index ? g.toNonIndexed() : g);
/** Weld coincident vertices so normals are smooth (merged parts are otherwise flat-shaded). */
function smooth(g: BufferGeometry) {
  g.deleteAttribute('normal');
  g.deleteAttribute('uv');
  const m = mergeVertices(g, 1e-3);
  m.computeVertexNormals();
  return m;
}

/** A Himalayan conifer (chir pine / deodar silhouette): tiered, drooping, irregular canopy with a visible trunk. ~1 m base unit. */
function coniferGeometry(seed: number) {
  const r = rng(seed);
  const parts: BufferGeometry[] = [];
  const trunk = new CylinderGeometry(0.05, 0.11, 2.2, 6);
  trunk.translate(0, 1.1, 0);
  parts.push(vcolor(trunk, () => [0.16, 0.12, 0.09]));
  const tiers = 6;
  for (let t = 0; t < tiers; t++) {
    const k = t / (tiers - 1);
    const rad = lerp(1.15, 0.28, k) * (0.85 + r() * 0.3);
    const h = lerp(1.25, 0.8, k);
    const y = 1.2 + t * 0.78;
    const cg = new ConeGeometry(rad, h, 11, 2, true);
    const p = cg.attributes.position as BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), yy = p.getY(i), z = p.getZ(i);
      const a = Math.atan2(z, x);
      const rr = Math.hypot(x, z);
      const n = 0.78 + 0.44 * vnoise(a * 2.2 + t * 3.1 + seed, yy * 1.3 + seed * 0.7);
      // branch tips droop
      p.setXYZ(i, Math.cos(a) * rr * n, yy - (rr / rad) * 0.22 * n, Math.sin(a) * rr * n);
    }
    cg.translate(0, y, 0);
    cg.rotateY(r() * 6.28);
    parts.push(vcolor(cg, (yy, x, z) => {
      const rr = Math.hypot(x, z) / rad;
      const shade = 0.55 + 0.45 * rr * (0.75 + 0.25 * k);
      return [0.11 * shade, 0.17 * shade, 0.12 * shade];
    }));
  }
  return smooth(mergeGeometries(parts.map((p) => (p.index ? p.toNonIndexed() : p))));
}

/** Broadleaf (oak/rhododendron) clump of displaced spheres. */
function broadleafGeometry(seed: number) {
  const r = rng(seed);
  const parts: BufferGeometry[] = [];
  const trunk = new CylinderGeometry(0.06, 0.12, 1.6, 6);
  trunk.translate(0, 0.8, 0);
  parts.push(ni(vcolor(trunk, () => [0.17, 0.13, 0.1])));
  for (let i = 0; i < 5; i++) {
    const s = new IcosahedronGeometry(0.75 + r() * 0.45, 2);
    const p = s.attributes.position as BufferAttribute;
    for (let k = 0; k < p.count; k++) {
      const v = new Vector3(p.getX(k), p.getY(k), p.getZ(k));
      v.multiplyScalar(0.8 + vnoise(v.x * 2 + seed + i, v.z * 2 + v.y) * 0.45);
      p.setXYZ(k, v.x, v.y * 0.8, v.z);
    }
    s.translate((r() - 0.5) * 1.3, 1.9 + r() * 1.1, (r() - 0.5) * 1.3);
    parts.push(ni(vcolor(s, (y) => { const sh = 0.6 + clamp((y - 1.4) / 2.2) * 0.4; return [0.13 * sh, 0.16 * sh, 0.1 * sh]; })));
  }
  return smooth(mergeGeometries(parts));
}

let treeGeos: BufferGeometry[] | null = null;
/**
 * Instanced forest. place(i) returns [x, y, z, scale] or null to skip.
 * Mixes three conifer variants and one broadleaf with per-instance tint.
 */
export function makeForest(count: number, place: (i: number) => [number, number, number, number] | null, o: { broad?: number; tint?: string } = {}) {
  treeGeos ??= [coniferGeometry(3), coniferGeometry(11), coniferGeometry(29), broadleafGeometry(7)];
  const mat = new MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 });
  const grp = new Group();
  const meshes = treeGeos.map((g) => {
    const m = new InstancedMesh(g, mat, count);
    m.count = 0;
    m.castShadow = true;
    m.receiveShadow = true;
    m.instanceColor = new InstancedBufferAttribute(new Float32Array(count * 3), 3);
    grp.add(m);
    return m;
  });
  const o3 = new Object3D();
  const tint = new Color(o.tint ?? '#ffffff');
  const c = new Color();
  const r = rng(91);
  for (let i = 0; i < count; i++) {
    const pl = place(i);
    if (!pl) continue;
    const [x, y, z, s] = pl;
    const kind = r() < (o.broad ?? 0.1) ? 3 : Math.floor(r() * 3);
    const m = meshes[kind];
    o3.position.set(x, y - 0.15, z);
    o3.scale.set(s, s * (0.85 + r() * 0.4), s);
    o3.rotation.set((r() - 0.5) * 0.06, r() * 6.28, (r() - 0.5) * 0.06);
    o3.updateMatrix();
    m.setMatrixAt(m.count, o3.matrix);
    c.setHSL(0.25 + (r() - 0.5) * 0.08, 0.1 + r() * 0.16, 0.34 + r() * 0.16).multiply(tint);
    c.multiplyScalar(2.3);
    m.setColorAt(m.count, c);
    m.count++;
  }
  meshes.forEach((m) => { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; m.computeBoundingSphere(); });
  return grp;
}

/** Instanced rocks / boulders. */
export function makeRocks(count: number, place: (i: number) => [number, number, number, number] | null, color = '#7a756c') {
  const g = new IcosahedronGeometry(1, 1);
  const p = g.attributes.position as BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const v = new Vector3(p.getX(i), p.getY(i), p.getZ(i));
    v.multiplyScalar(0.75 + vnoise(v.x * 1.7 + 3, v.z * 1.7 + v.y * 2) * 0.5);
    p.setXYZ(i, v.x, v.y * 0.62, v.z);
  }
  g.computeVertexNormals();
  const mat = addGrain(new MeshStandardMaterial({ color, roughness: 0.92, flatShading: true }), { scale: 4, strength: 0.2 });
  const inst = new InstancedMesh(g, mat, count);
  const o3 = new Object3D();
  const r = rng(17);
  let k = 0;
  for (let i = 0; i < count; i++) {
    const pl = place(i);
    if (!pl) continue;
    o3.position.set(pl[0], pl[1], pl[2]);
    o3.scale.set(pl[3] * (0.7 + r() * 0.6), pl[3], pl[3] * (0.7 + r() * 0.6));
    o3.rotation.set(r() * 0.4, r() * 6.28, r() * 0.4);
    o3.updateMatrix();
    inst.setMatrixAt(k++, o3.matrix);
  }
  inst.count = k;
  inst.castShadow = true;
  inst.receiveShadow = true;
  return inst;
}

/* ------------------------------------------------------------------ */
/* Dust                                                                */
/* ------------------------------------------------------------------ */
/** Soft dust puffs from digging, dumping and tyres. emit() then step(dt) each frame. */
export class Dust {
  points: Points;
  private pos: Float32Array;
  private vel: Float32Array;
  private life: Float32Array;
  private size: Float32Array;
  private n: number;
  private i = 0;
  alive = 0;
  constructor(n = 220, color = '#9c8a74') {
    this.n = n;
    this.pos = new Float32Array(n * 3).fill(-999);
    this.vel = new Float32Array(n * 3);
    this.life = new Float32Array(n);
    this.size = new Float32Array(n);
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(this.pos, 3));
    g.setAttribute('aLife', new BufferAttribute(this.life, 1));
    g.setAttribute('aSize', new BufferAttribute(this.size, 1));
    const m = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: NormalBlending,
      uniforms: { uColor: { value: new Color(color) }, uScale: { value: 300 } },
      vertexShader: `attribute float aLife; attribute float aSize; varying float vL; uniform float uScale;
        void main(){ vL = aLife; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mv;
          gl_PointSize = aSize * (1.6 - aLife * 0.6) * uScale / -mv.z; }`,
      fragmentShader: `varying float vL; uniform vec3 uColor;
        void main(){ vec2 d = gl_PointCoord - 0.5; float r = dot(d,d)*4.0; if (r > 1.0) discard;
          float a = (1.0 - r) * (1.0 - r) * vL * 0.34; gl_FragColor = vec4(uColor, a);
          #include <colorspace_fragment>
        }`,
    });
    this.points = new Points(g, m);
    this.points.frustumCulled = false;
    this.points.renderOrder = 5;
  }
  emit(x: number, y: number, z: number, count: number, spread = 0.4, up = 0.6, size = 1.2) {
    for (let k = 0; k < count; k++) {
      const i = this.i = (this.i + 1) % this.n;
      this.pos[i * 3] = x + (Math.random() - 0.5) * spread;
      this.pos[i * 3 + 1] = y + Math.random() * spread * 0.5;
      this.pos[i * 3 + 2] = z + (Math.random() - 0.5) * spread;
      this.vel[i * 3] = (Math.random() - 0.5) * 0.7;
      this.vel[i * 3 + 1] = up * (0.4 + Math.random() * 0.8);
      this.vel[i * 3 + 2] = (Math.random() - 0.5) * 0.7;
      this.life[i] = 1;
      this.size[i] = size * (0.6 + Math.random() * 0.8);
    }
  }
  step(dt: number) {
    let alive = 0;
    for (let i = 0; i < this.n; i++) {
      if (this.life[i] <= 0) continue;
      this.life[i] = Math.max(0, this.life[i] - dt * 0.42);
      this.pos[i * 3] += this.vel[i * 3] * dt + 0.25 * dt;
      this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt;
      this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
      this.vel[i * 3 + 1] *= 0.985;
      if (this.life[i] > 0) alive++;
    }
    this.alive = alive;
    const g = this.points.geometry;
    g.attributes.position.needsUpdate = true;
    g.attributes.aLife.needsUpdate = true;
    g.attributes.aSize.needsUpdate = true;
  }
}

/* ------------------------------------------------------------------ */
/* Earthworks                                                          */
/* ------------------------------------------------------------------ */
/** A ground slab with rectangular openings (for pits and trenches). holes: [cx, cz, w, l]. */
export function slabWithHoles(w: number, d: number, holes: [number, number, number, number][], mat: Material, cx = 0, cz = 0) {
  const s = new Shape();
  s.moveTo(cx - w / 2, cz - d / 2); s.lineTo(cx + w / 2, cz - d / 2); s.lineTo(cx + w / 2, cz + d / 2); s.lineTo(cx - w / 2, cz + d / 2); s.closePath();
  for (const [hx, hz, hw, hl] of holes) {
    const h = new Shape();
    h.moveTo(hx - hw / 2, hz - hl / 2); h.lineTo(hx - hw / 2, hz + hl / 2); h.lineTo(hx + hw / 2, hz + hl / 2); h.lineTo(hx + hw / 2, hz - hl / 2); h.closePath();
    s.holes.push(h as unknown as Path);
  }
  const g = new ShapeGeometry(s);
  g.rotateX(Math.PI / 2);
  // ShapeGeometry in XY → after rotation the shape's y becomes z; flip to keep orientation.
  const p = g.attributes.position as BufferAttribute;
  for (let i = 0; i < p.count; i++) p.setY(i, 0);
  g.computeVertexNormals();
  const n = g.attributes.normal as BufferAttribute;
  for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 1, 0);
  const m = new Mesh(g, mat);
  m.material.side = DoubleSide;
  m.receiveShadow = true;
  return m;
}

/**
 * An excavation that deepens: rough inner walls with exposed strata and a
 * loose floor. Its opening must be cut in the surrounding ground (slabWithHoles).
 * set(depth) changes the visible depth; set(0) hides it.
 */
export class Excavation {
  grp = new Group();
  private walls: Mesh;
  private floor: Mesh;
  constructor(public w: number, public l: number, public maxDepth: number, wallColor = '#6e5541', floorColor = '#4a3a2c') {
    const wg = new BoxGeometry(w, 1, l, Math.max(2, Math.round(w * 3)), 4, Math.max(2, Math.round(l * 3)));
    wg.translate(0, -0.5, 0);
    // roughen the walls slightly (but keep the rim straight)
    const p = wg.attributes.position as BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      if (y > -0.01 || y < -0.99) continue;
      const n = (vnoise(x * 3.1 + z * 2.3, y * 4) - 0.5) * 0.07;
      p.setXYZ(i, x + Math.sign(x) * n, y, z + Math.sign(z) * n);
    }
    wg.computeVertexNormals();
    const wm = new MeshStandardMaterial({ color: wallColor, roughness: 1, side: BackSide });
    addGrain(wm, { scale: 3, strength: 0.32 });
    this.walls = new Mesh(wg, wm);
    this.walls.receiveShadow = true;
    this.floor = new Mesh(new PlaneGeometry(w * 0.98, l * 0.98, 6, 6), soil(floorColor, { scale: 3, strength: 0.35 }));
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.receiveShadow = true;
    this.grp.add(this.walls, this.floor);
    this.set(0);
  }
  set(depth: number) {
    const d = clamp(depth, 0, this.maxDepth);
    this.grp.visible = d > 0.005;
    this.walls.scale.y = Math.max(d, 0.001);
    this.floor.position.y = -d + 0.002;
  }
}

/** A loose soil heap (half-ellipsoid with lumpy surface). Scale it to grow. */
export function heapGeometry(seed = 1, flat = 0.5) {
  const g = new SphereGeometry(1, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  const pos = g.attributes.position as BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const n = 0.86 + fbm(x * 2.6 + seed * 5, z * 2.6 + seed) * 0.3;
    // angle of repose: steeper flanks, softened crown
    const yy = Math.pow(y, 0.85) * flat;
    pos.setXYZ(i, x * n, yy * n, z * n);
  }
  g.computeVertexNormals();
  return g;
}
export function makeHeap(color = '#6a5442', seed = 1, flat = 0.5) {
  const m = new Mesh(heapGeometry(seed, flat), soil(color, { scale: 5, strength: 0.38 }));
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/* ------------------------------------------------------------------ */
/* Site props                                                          */
/* ------------------------------------------------------------------ */
let _coneG: BufferGeometry | null = null;
export function makeCones(pts: [number, number, number?][]) {
  _coneG ??= (() => {
    const cone = new ConeGeometry(0.17, 0.62, 16, 1, true);
    cone.translate(0, 0.33, 0);
    const base = new BoxGeometry(0.4, 0.04, 0.4);
    base.translate(0, 0.02, 0);
    const c = mergeGeometries([vcolor(cone.index ? cone.toNonIndexed() : cone, (y) => (y > 0.36 && y < 0.46 ? [0.92, 0.9, 0.86] : [0.82, 0.36, 0.14])), vcolor(base.index ? base.toNonIndexed() : base, () => [0.08, 0.08, 0.08])]);
    c.computeVertexNormals();
    return c;
  })();
  const m = new InstancedMesh(_coneG, new MeshStandardMaterial({ vertexColors: true, roughness: 0.55 }), pts.length);
  const o = new Object3D();
  pts.forEach(([x, z, y = 0], i) => { o.position.set(x, y, z); o.rotation.y = i; o.updateMatrix(); m.setMatrixAt(i, o.matrix); });
  m.castShadow = true;
  return m;
}

/** Concrete RCC hume pipes. pts: [x, y, z, rotY]. */
export function makePipes(pts: [number, number, number, number][], r = 0.5, len = 2.4) {
  const outer = new CylinderGeometry(r, r, len, 28, 1, true);
  outer.rotateX(Math.PI / 2);
  const inner = new CylinderGeometry(r * 0.86, r * 0.86, len, 28, 1, true);
  inner.rotateX(Math.PI / 2);
  const mat = addGrain(new MeshStandardMaterial({ color: '#9d978d', roughness: 0.95, side: DoubleSide }), { scale: 3, strength: 0.14 });
  const g = new Group();
  for (const [x, y, z, ry] of pts) {
    const p = new Mesh(outer, mat);
    const q = new Mesh(inner, mat);
    p.position.set(x, y, z); q.position.set(x, y, z);
    p.rotation.y = q.rotation.y = ry;
    p.castShadow = true; p.receiveShadow = true; q.receiveShadow = true;
    g.add(p, q);
  }
  return g;
}

export function makeBarricade(x: number, z: number, ry = 0, len = 2.2) {
  const g = new Group();
  const white = new MeshStandardMaterial({ color: '#d9d4c9', roughness: 0.7 });
  const orange = new MeshStandardMaterial({ color: '#c96a2e', roughness: 0.6 });
  const dark = new MeshStandardMaterial({ color: '#2a2d30', roughness: 0.8 });
  const board = new Mesh(new BoxGeometry(len, 0.3, 0.04), white);
  board.position.y = 0.9;
  g.add(board);
  const n = Math.round(len / 0.5);
  for (let i = 0; i < n; i++) {
    const s = new Mesh(new BoxGeometry(0.2, 0.31, 0.045), orange);
    s.position.set(-len / 2 + 0.25 + i * (len - 0.5) / Math.max(1, n - 1), 0.9, 0);
    s.rotation.z = 0.5;
    g.add(s);
  }
  for (const dx of [-len / 2 + 0.1, len / 2 - 0.1]) {
    const leg = new Mesh(new BoxGeometry(0.05, 0.95, 0.05), dark);
    leg.position.set(dx, 0.47, 0);
    const foot = new Mesh(new BoxGeometry(0.06, 0.04, 0.5), dark);
    foot.position.set(dx, 0.02, 0);
    g.add(leg, foot);
  }
  g.traverse((o) => { o.castShadow = true; });
  g.position.set(x, 0, z);
  g.rotation.y = ry;
  return g;
}

/** Survey pegs with a string line (setting-out of a trench or footing). */
export function makeSettingOut(pts: [number, number][], y = 0) {
  const g = new Group();
  const peg = new MeshStandardMaterial({ color: '#c8b48c', roughness: 0.8 });
  const tip = new MeshStandardMaterial({ color: '#d2552a', roughness: 0.5 });
  pts.forEach(([x, z]) => {
    const p = new Mesh(new BoxGeometry(0.04, 0.5, 0.04), peg);
    p.position.set(x, y + 0.25, z);
    const t = new Mesh(new BoxGeometry(0.045, 0.06, 0.045), tip);
    t.position.set(x, y + 0.48, z);
    g.add(p, t);
  });
  const line = new MeshBasicMaterial({ color: '#ece6d8' });
  for (let i = 0; i < pts.length; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[(i + 1) % pts.length];
    const L = Math.hypot(bx - ax, bz - az);
    const s = new Mesh(new BoxGeometry(L, 0.008, 0.008), line);
    s.position.set((ax + bx) / 2, y + 0.4, (az + bz) / 2);
    s.rotation.y = -Math.atan2(bz - az, bx - ax);
    g.add(s);
  }
  return g;
}

/** Lime marking line on the ground (for footing / trench outlines). */
export function makeLimeOutline(pts: [number, number][], y = 0.012, w = 0.08) {
  const g = new Group();
  const m = new MeshStandardMaterial({ color: '#c9c2b2', roughness: 1, transparent: true, opacity: 0.75 });
  for (let i = 0; i < pts.length; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[(i + 1) % pts.length];
    const L = Math.hypot(bx - ax, bz - az);
    const s = new Mesh(new PlaneGeometry(L, w), m);
    s.rotation.x = -Math.PI / 2;
    s.rotation.z = Math.atan2(bz - az, bx - ax) * -1;
    s.position.set((ax + bx) / 2, y, (az + bz) / 2);
    s.receiveShadow = true;
    g.add(s);
  }
  return g;
}

/** Rebar cage for a column footing (mat + starter bars). */
export function makeRebarCage(w = 1.2, h = 1.6) {
  const g = new Group();
  const m = new MeshStandardMaterial({ color: '#6b4a36', roughness: 0.7, metalness: 0.5 });
  const bar = (L: number) => new CylinderGeometry(0.012, 0.012, L, 5);
  for (let i = 0; i < 6; i++) {
    const a = new Mesh(bar(w), m); a.rotation.z = Math.PI / 2; a.position.set(0, 0.06, -w / 2 + (i * w) / 5); g.add(a);
    const b = new Mesh(bar(w), m); b.rotation.x = Math.PI / 2; b.position.set(-w / 2 + (i * w) / 5, 0.08, 0); g.add(b);
  }
  for (const [x, z] of [[-0.15, -0.15], [0.15, -0.15], [-0.15, 0.15], [0.15, 0.15], [0, -0.15], [0, 0.15]]) {
    const v = new Mesh(bar(h), m); v.position.set(x, h / 2, z); g.add(v);
  }
  for (let k = 0; k < 6; k++) {
    // stirrup: a closed ring of four bars
    for (const [dx, dz, rot] of [[0, -0.16, 0], [0, 0.16, 0], [-0.16, 0, 1], [0.16, 0, 1]]) {
      const t = new Mesh(new BoxGeometry(0.34, 0.012, 0.012), m);
      t.position.set(dx, 0.3 + k * 0.22, dz);
      t.rotation.y = rot * Math.PI / 2;
      g.add(t);
    }
  }
  g.traverse((o) => { o.castShadow = true; });
  return g;
}

/** Wire-mesh gabion baskets filled with river stone. */
export function makeGabions(n: number, x0: number, z: number, y0 = 0, rows = 2) {
  const g = new Group();
  const stone = addGrain(new MeshStandardMaterial({ color: '#8a8478', roughness: 0.95 }), { scale: 9, strength: 0.45 });
  const wire = new MeshStandardMaterial({ color: '#7d8186', metalness: 0.7, roughness: 0.5, wireframe: true });
  for (let r = 0; r < rows; r++) {
    for (let i = 0; i < n - r; i++) {
      const b = new Mesh(new BoxGeometry(2, 1, 1, 1, 1, 1), stone);
      b.position.set(x0 + i * 2.02 + r * 1.0, y0 + 0.5 + r * 1.0, z - r * 0.5);
      b.castShadow = true; b.receiveShadow = true;
      const w = new Mesh(new BoxGeometry(2.01, 1.01, 1.01, 8, 4, 4), wire);
      w.position.copy(b.position);
      g.add(b, w);
    }
  }
  return g;
}

/** Animated water surface (river). Update mat.uniforms.uTime. */
export function makeWater(w: number, l: number, color = '#3b4d55') {
  const mat = new MeshStandardMaterial({ color, roughness: 0.12, metalness: 0.1, transparent: true, opacity: 0.88 });
  const uTime = { value: 0 };
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = uTime;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vKWP;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvKWP = (modelMatrix * vec4(transformed,1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vKWP; uniform float uTime;\n${GLSL_NOISE}`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        vec2 wp = vKWP.xz * vec2(0.9, 2.2) + vec2(uTime * 1.4, 0.0);
        float e = 0.08;
        float h0 = kFbm(wp), hx = kFbm(wp + vec2(e, 0.0)), hz = kFbm(wp + vec2(0.0, e));
        vec3 pert = vec3((h0 - hx), 0.0, (h0 - hz)) * 3.0;
        normal = normalize(normal + (viewMatrix * vec4(pert, 0.0)).xyz);
        `)
      .replace('#include <color_fragment>', `#include <color_fragment>
        float foam = smoothstep(0.62, 0.8, kFbm(vKWP.xz * vec2(1.2, 3.0) + vec2(uTime * 2.0, 0.0)));
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.72, 0.74, 0.72), foam * 0.35);`);
  };
  mat.customProgramCacheKey = () => 'water';
  const m = new Mesh(new PlaneGeometry(w, l, 1, 1), mat);
  m.rotation.x = -Math.PI / 2;
  m.receiveShadow = true;
  return { mesh: m, uTime };
}

/** A road ribbon following a polyline [x,y,z] with asphalt, worn edges and a shoulder. */
export function makeRoad(pts: Vector3[], width = 6.2, o: { lines?: boolean; color?: string } = {}) {
  const N = pts.length;
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  let acc = 0;
  for (let i = 0; i < N; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(N - 1, i + 1)];
    const dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz) || 1;
    const nx = -dz / L, nz = dx / L;
    if (i) acc += pts[i].distanceTo(pts[i - 1]);
    for (const s of [-1, 1]) {
      pos.push(pts[i].x + nx * s * width / 2, pts[i].y + 0.02, pts[i].z + nz * s * width / 2);
      uv.push(s < 0 ? 0 : 1, acc);
    }
    if (i < N - 1) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  const mat = new MeshStandardMaterial({ color: o.color ?? '#3e3c39', roughness: 0.93, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const lines = o.lines !== false;
  mat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vRUv; varying vec3 vKWP;').replace('#include <uv_vertex>', '#include <uv_vertex>\nvRUv = uv;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvKWP = (modelMatrix * vec4(transformed,1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>\nvarying vec2 vRUv; varying vec3 vKWP;\n${GLSL_NOISE}`).replace('#include <color_fragment>', `#include <color_fragment>
      float u = vRUv.x;
      float grain = kNoise(vKWP.xz * 6.0) * 0.5 + kFbm(vKWP.xz * 0.6) * 0.5;
      diffuseColor.rgb *= 0.86 + grain * 0.28;
      // wheel-track polish and edge wear
      diffuseColor.rgb *= 1.0 - 0.06 * (smoothstep(0.22, 0.3, u) - smoothstep(0.34, 0.42, u) + smoothstep(0.58, 0.66, u) - smoothstep(0.7, 0.78, u));
      float edge = smoothstep(0.06, 0.0, u) + smoothstep(0.94, 1.0, u);
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.36, 0.31, 0.26), edge * (0.6 + 0.4 * kNoise(vKWP.xz * 3.0)));
      ${lines ? `float ln = (smoothstep(0.075, 0.085, u) - smoothstep(0.095, 0.105, u)) + (smoothstep(0.895, 0.905, u) - smoothstep(0.915, 0.925, u));
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.78, 0.76, 0.71), ln * (0.65 + 0.35 * kNoise(vKWP.xz * 2.0)));` : ''}`);
  };
  mat.customProgramCacheKey = () => `road${lines}`;
  const m = new Mesh(g, mat);
  m.receiveShadow = true;
  return m;
}

/* ------------------------------------------------------------------ */
/* Path following                                                      */
/* ------------------------------------------------------------------ */
export interface PathPose { x: number; z: number; heading: number; odo: number; steer: number; speed: number }
/**
 * Machine path from keyframes [p, x, z, headingRad]. Heading is explicit so a
 * machine can reverse. odo (signed distance, for wheel roll) and front-wheel
 * steer angle are derived from the motion itself.
 */
export function pathTrack(keys: number[][], wheelbase = 2.25, fn = easeIO) {
  const N = 1200;
  const xs = new Float32Array(N + 1), zs = new Float32Array(N + 1), hs = new Float32Array(N + 1), od = new Float32Array(N + 1), st = new Float32Array(N + 1), sp = new Float32Array(N + 1);
  for (let i = 0; i <= N; i++) { const [x, z, h] = track(keys, i / N, fn); xs[i] = x; zs[i] = z; hs[i] = h; }
  for (let i = 1; i <= N; i++) {
    const dx = xs[i] - xs[i - 1], dz = zs[i] - zs[i - 1];
    const fwd = dx * Math.cos(hs[i]) - dz * Math.sin(hs[i]);
    const ds = Math.hypot(dx, dz) * Math.sign(fwd || 1);
    od[i] = od[i - 1] + ds;
    sp[i] = ds * N;
    const dh = hs[i] - hs[i - 1];
    st[i] = Math.abs(ds) > 1e-5 ? clamp(Math.atan((wheelbase * dh) / ds), -0.6, 0.6) : st[i - 1];
  }
  st[0] = st[1];
  // smooth steering
  const sm = Float32Array.from(st);
  for (let k = 0; k < 3; k++) for (let i = 2; i < N - 1; i++) sm[i] = (sm[i - 2] + sm[i - 1] + sm[i] + sm[i + 1] + sm[i + 2]) / 5;
  return (p: number): PathPose => {
    const f = clamp(p) * N, i = Math.min(N - 1, Math.floor(f)), t = f - i;
    return { x: lerp(xs[i], xs[i + 1], t), z: lerp(zs[i], zs[i + 1], t), heading: lerp(hs[i], hs[i + 1], t), odo: lerp(od[i], od[i + 1], t), steer: lerp(sm[i], sm[i + 1], t), speed: sp[i + 1] };
  };
}

/** Orbit camera keyframe: [p, azDeg, elDeg, dist, tx, ty, tz]. */
export function orbit(cam: { position: Vector3; lookAt: (v: Vector3) => void }, k: number[], tmp = new Vector3()) {
  const [az, el, dist, tx, ty, tz] = k;
  cam.position.set(tx + Math.cos(el * D) * Math.cos(az * D) * dist, ty + Math.sin(el * D) * dist, tz + Math.sin(az * D) * Math.cos(el * D) * dist);
  cam.lookAt(tmp.set(tx, ty, tz));
}

export { AdditiveBlending };
