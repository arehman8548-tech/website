/**
 * Supporting vehicles and structures, at real scale (metres), facing +X:
 * a 3-axle tipper, a prime mover with a low-bed trailer, a service pickup,
 * a portal-frame workshop shed and a site-office container.
 */
import {
  BoxGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  LatheGeometry,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  Shape,
  Vector2,
  type Material,
} from 'three';
import { addGrain, clamp, heapGeometry } from './kit';

type P = [number, number];
function extrude(pts: P[], depth: number, bevel = 0.02) {
  const s = new Shape();
  s.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
  s.closePath();
  const g = new ExtrudeGeometry(s, { depth: depth - bevel * 2, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 1, curveSegments: 4 });
  g.translate(0, 0, -(depth - bevel * 2) / 2);
  g.computeVertexNormals();
  return g;
}
function box(w: number, h: number, d: number, m: Material, x = 0, y = 0, z = 0) {
  const b = new Mesh(new BoxGeometry(w, h, d), m);
  b.position.set(x, y, z);
  return b;
}
function shadows(o: Object3D) {
  o.traverse((c) => { if ((c as Mesh).isMesh) { c.castShadow = true; c.receiveShadow = true; } });
}

export function vehicleMats() {
  return {
    cabWhite: addGrain(new MeshPhysicalMaterial({ color: '#d9d4c7', roughness: 0.42, metalness: 0.15, clearcoat: 0.3 }), { scale: 2, strength: 0.06, rough: 0.05 }),
    bodyRust: addGrain(new MeshStandardMaterial({ color: '#7a3a22', roughness: 0.75, metalness: 0.35 }), { scale: 2.5, strength: 0.22 }),
    steel: new MeshStandardMaterial({ color: '#4a4e52', roughness: 0.6, metalness: 0.6 }),
    dark: new MeshStandardMaterial({ color: '#17191b', roughness: 0.75, metalness: 0.3 }),
    tyre: new MeshStandardMaterial({ color: '#141414', roughness: 0.93 }),
    rim: new MeshStandardMaterial({ color: '#8d8f90', roughness: 0.4, metalness: 0.8 }),
    glass: new MeshPhysicalMaterial({ color: '#0c1418', roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.7, clearcoat: 1 }),
    lamp: new MeshStandardMaterial({ color: '#fff1d6', emissive: new Color('#ffcf8a'), emissiveIntensity: 0.5 }),
    amber: new MeshStandardMaterial({ color: '#e08a4f', emissive: new Color('#e07a30'), emissiveIntensity: 0.9 }),
    deck: addGrain(new MeshStandardMaterial({ color: '#3a3d40', roughness: 0.8, metalness: 0.5 }), { scale: 3, strength: 0.2 }),
    yellow: new MeshStandardMaterial({ color: '#c99a2e', roughness: 0.6, metalness: 0.2 }),
    soil: addGrain(new MeshStandardMaterial({ color: '#6b5240', roughness: 1, flatShading: true }), { scale: 5, strength: 0.35 }),
  };
}
export type VMats = ReturnType<typeof vehicleMats>;

function truckWheel(r: number, w: number, m: VMats, dual = false) {
  const g = new Group();
  const hw = w / 2;
  const prof = [new Vector2(r * 0.55, -hw), new Vector2(r * 0.92, -hw), new Vector2(r, -hw * 0.7), new Vector2(r, hw * 0.7), new Vector2(r * 0.92, hw), new Vector2(r * 0.55, hw)];
  const tg = new LatheGeometry(prof, 30);
  tg.rotateX(Math.PI / 2);
  const add = (z: number) => {
    const t = new Mesh(tg, m.tyre);
    t.position.z = z;
    g.add(t);
    const rim = new Mesh(new CylinderGeometry(r * 0.56, r * 0.56, w * 0.9, 20), m.rim);
    rim.rotation.x = Math.PI / 2;
    rim.position.z = z;
    g.add(rim);
    const hub = new Mesh(new CylinderGeometry(r * 0.2, r * 0.2, w * 0.96, 10), m.dark);
    hub.rotation.x = Math.PI / 2;
    hub.position.z = z;
    g.add(hub);
  };
  add(0);
  if (dual) add(-w * 1.05);
  return g;
}

/** Wheels roll with odo. */
function axle(g: Group, x: number, r: number, track: number, m: VMats, dual: boolean, list: { g: Group; r: number }[]) {
  for (const s of [-1, 1]) {
    const w = truckWheel(r, 0.32, m, dual);
    w.position.set(x, r, (s * track) / 2);
    if (s < 0) w.rotation.y = Math.PI;
    g.add(w);
    list.push({ g: w, r });
  }
}

/** Indian-style cab-over truck cab, front face at x = 0, cab extends to -L. */
function truckCab(m: VMats, L = 1.7, Wd = 2.35, top = 3.0, floor = 1.15, mat = m.cabWhite) {
  const g = new Group();
  g.add(new Mesh(extrude([[-L, floor], [0, floor], [0.08, floor + 0.5], [0.02, top - 0.55], [-0.12, top], [-L, top]], Wd, 0.05), mat));
  // windscreen + side windows
  const ws = box(0.03, 0.85, Wd - 0.25, m.glass, 0.04, top - 0.85, 0);
  ws.rotation.z = 0.1;
  g.add(ws);
  for (const s of [-1, 1]) g.add(box(0.9, 0.7, 0.02, m.glass, -0.62, top - 0.75, (s * Wd) / 2 + s * 0.01));
  // bumper, grille, lamps, mirrors, steps
  g.add(box(0.18, 0.3, Wd + 0.1, m.dark, 0.1, floor - 0.05, 0));
  for (let i = 0; i < 4; i++) g.add(box(0.02, 0.05, Wd * 0.55, m.dark, 0.09, floor + 0.22 + i * 0.1, 0));
  for (const s of [-1, 1]) {
    g.add(box(0.04, 0.14, 0.26, m.lamp, 0.11, floor + 0.12, s * (Wd / 2 - 0.25)));
    const arm = box(0.04, 0.04, 0.35, m.dark, 0.05, top - 0.6, s * (Wd / 2 + 0.17));
    g.add(arm, box(0.04, 0.38, 0.2, m.dark, 0.07, top - 0.75, s * (Wd / 2 + 0.33)));
    g.add(box(0.4, 0.04, 0.2, m.dark, -0.25, floor - 0.35, s * (Wd / 2 - 0.05)));
  }
  g.add(box(0.12, 0.06, 0.12, m.amber, -0.6, top + 0.04, 0));
  return g;
}

/* ------------------------------------------------------------------ */
/** 3-axle tipper (~7.8 m). tip(0..1) raises the body, fill(0..1) heaps material in it. */
export function buildTipper(m: VMats) {
  const root = new Group();
  const wheels: { g: Group; r: number }[] = [];
  const R = 0.53, TR = 1.95;
  // chassis rails
  for (const s of [-1, 1]) root.add(box(7.0, 0.26, 0.12, m.dark, 0.1, 0.98, s * 0.45));
  root.add(box(0.2, 0.2, 1.0, m.dark, 3.6, 0.95, 0));
  const cab = truckCab(m);
  cab.position.x = 3.85;
  root.add(cab);
  root.add(box(0.6, 0.45, 0.5, m.steel, 1.6, 0.85, 1.0)); // fuel tank
  root.add(box(0.4, 0.5, 0.45, m.dark, 1.6, 0.85, -1.0)); // battery box
  axle(root, 3.0, R, TR, m, false, wheels);
  axle(root, -1.55, R, TR - 0.3, m, true, wheels);
  axle(root, -2.85, R, TR - 0.3, m, true, wheels);
  // tipping body, pivot at the rear
  const pivot = new Group();
  pivot.position.set(-3.45, 1.22, 0);
  root.add(pivot);
  const L = 5.2, W = 2.4, Hs = 1.15;
  pivot.add(box(L, 0.08, W, m.bodyRust, L / 2, 0.04, 0));
  for (const s of [-1, 1]) {
    const side = new Mesh(extrude([[0, 0], [L, 0], [L, Hs + 0.2], [0.3, Hs]], 0.07, 0.01), m.bodyRust);
    side.position.z = s * (W / 2);
    pivot.add(side);
    for (let i = 1; i < 5; i++) pivot.add(box(0.07, Hs, 0.06, m.bodyRust, (i * L) / 5, Hs / 2, s * (W / 2 + 0.05)));
  }
  pivot.add(box(0.08, Hs + 0.5, W, m.bodyRust, L, (Hs + 0.5) / 2, 0)); // headboard
  pivot.add(box(0.6, 0.06, W, m.bodyRust, L + 0.25, Hs + 0.5, 0)); // cab guard
  const tail = box(0.07, Hs, W - 0.1, m.bodyRust, 0.02, Hs / 2, 0);
  pivot.add(tail);
  const fill = new Mesh(heapGeometry(4, 0.55), m.soil);
  fill.position.set(L * 0.52, 0.08, 0);
  pivot.add(fill);
  const ram = new Mesh(new CylinderGeometry(0.09, 0.09, 1, 12), m.steel);
  root.add(ram);
  shadows(root);
  let odo = 0;
  return {
    root,
    wheelR: R,
    /** Material level in the body (0..1). */
    fill(f: number) {
      fill.visible = f > 0.02;
      fill.scale.set((L / 2) * 0.9, 1.3 * clamp(f), (W / 2) * 0.88);
    },
    tip(t: number) {
      pivot.rotation.z = clamp(t) * 0.85;
      const fx = 3.2 * Math.cos(pivot.rotation.z) - 3.45, fy = 1.22 + 3.2 * Math.sin(pivot.rotation.z);
      const bx = 1.1, by = 1.0;
      ram.position.set((fx + bx) / 2, (fy + by) / 2, 0);
      ram.scale.y = Math.hypot(fx - bx, fy - by);
      ram.rotation.z = Math.atan2(fy - by, fx - bx) - Math.PI / 2;
    },
    roll(distance: number) {
      odo = distance;
      for (const w of wheels) w.g.rotation.z = -odo / w.r;
    },
  };
}

/* ------------------------------------------------------------------ */
/** Prime mover + gooseneck low-bed trailer (~17 m). The deck top is at y = deckY; its centre at x = deckX. */
export function buildLowbed(m: VMats) {
  const root = new Group();
  const wheels: { g: Group; r: number }[] = [];
  // prime mover
  for (const s of [-1, 1]) root.add(box(5.6, 0.28, 0.12, m.dark, 5.2, 1.0, s * 0.45));
  const cab = truckCab(m, 2.0, 2.45, 3.15, 1.2, m.cabWhite);
  cab.position.x = 8.0;
  root.add(cab);
  root.add(box(0.7, 0.55, 0.55, m.steel, 6.4, 0.9, 1.05));
  root.add(box(1.4, 0.12, 1.4, m.dark, 4.4, 1.28, 0)); // fifth wheel
  axle(root, 7.1, 0.55, 2.0, m, false, wheels);
  axle(root, 4.5, 0.55, 1.7, m, true, wheels);
  axle(root, 3.25, 0.55, 1.7, m, true, wheels);
  // gooseneck
  root.add(new Mesh(extrude([[2.6, 1.0], [4.9, 1.45], [4.9, 1.85], [2.2, 1.85], [1.4, 1.05]], 2.5, 0.03), m.yellow));
  // deck
  const deckY = 1.0;
  const deck = box(10.5, 0.22, 3.0, m.deck, -3.9, deckY - 0.11, 0);
  root.add(deck);
  for (const s of [-1, 1]) root.add(box(10.5, 0.3, 0.12, m.yellow, -3.9, deckY - 0.2, s * 1.48));
  // deck planks
  for (let i = 0; i < 18; i++) root.add(box(0.04, 0.005, 2.9, m.dark, -8.9 + i * 0.58, deckY + 0.003, 0));
  for (const x of [-7.4, -8.4, -9.4]) axle(root, x, 0.42, 2.3, m, true, wheels);
  // folding rear ramps
  const ramps: Group[] = [];
  for (const s of [-1, 1]) {
    const r = new Group();
    r.position.set(-9.15, deckY, s * 0.95);
    const plate = box(2.3, 0.08, 0.75, m.yellow, -1.15, 0, 0);
    r.add(plate);
    for (let i = 0; i < 8; i++) r.add(box(0.03, 0.03, 0.72, m.dark, -0.2 - i * 0.27, 0.05, 0));
    root.add(r);
    ramps.push(r);
  }
  shadows(root);
  const api = {
    root,
    deckY,
    deckX: -4.2,
    /** 0 = ramps stowed upright, 1 = down on the ground. */
    ramps(t: number) {
      const down = Math.asin(clamp(deckY / 2.3, 0, 1));
      for (const r of ramps) r.rotation.z = (1 - clamp(t)) * -1.35 + clamp(t) * down;
    },
    roll(distance: number) { for (const w of wheels) w.g.rotation.z = -distance / w.r; },
  };
  api.ramps(0);
  return api;
}

/* ------------------------------------------------------------------ */
/** Service pickup with toolbox, spares and amber beacon (~5 m). */
export function buildPickup(m: VMats) {
  const root = new Group();
  const wheels: { g: Group; r: number }[] = [];
  root.add(new Mesh(extrude([[-2.5, 0.6], [2.4, 0.6], [2.5, 0.95], [2.3, 1.15], [1.15, 1.2], [0.6, 1.95], [-0.5, 1.95], [-0.55, 1.15], [-2.5, 1.15]], 1.78, 0.05), m.cabWhite));
  const ws = box(0.03, 0.62, 1.55, m.glass, 0.9, 1.56, 0);
  ws.rotation.z = 0.85;
  root.add(ws);
  for (const s of [-1, 1]) root.add(box(1.0, 0.5, 0.02, m.glass, 0.05, 1.6, s * 0.9));
  root.add(box(0.15, 0.22, 1.85, m.dark, 2.48, 0.68, 0));
  for (const s of [-1, 1]) root.add(box(0.03, 0.1, 0.3, m.lamp, 2.5, 0.98, s * 0.62));
  // load bed contents
  root.add(box(1.0, 0.5, 1.5, m.yellow, -1.25, 1.42, 0)); // toolbox
  root.add(box(0.5, 0.45, 0.45, m.steel, -2.1, 1.38, 0.45)); // drum
  const drum = new Mesh(new CylinderGeometry(0.28, 0.28, 0.85, 14), m.bodyRust);
  drum.position.set(-2.05, 1.58, -0.42);
  root.add(drum);
  root.add(box(0.1, 0.1, 0.1, m.amber, -0.05, 2.02, 0));
  axle(root, 1.55, 0.38, 1.55, m, false, wheels);
  axle(root, -1.55, 0.38, 1.55, m, false, wheels);
  shadows(root);
  return { root, roll(d: number) { for (const w of wheels) w.g.rotation.z = -d / w.r; } };
}

/* ------------------------------------------------------------------ */
/**
 * Steel portal-frame shed. built(0..1) erects it bay by bay (columns →
 * rafters → purlins → sheeting) for construction scenes; 1 = finished.
 */
export function buildShed(o: { bays?: number; bay?: number; span?: number; eave?: number; clad?: boolean } = {}) {
  const bays = o.bays ?? 5, bay = o.bay ?? 6, span = o.span ?? 16, eave = o.eave ?? 6.5, ridge = eave + span * 0.12;
  const root = new Group();
  const steel = new MeshStandardMaterial({ color: '#5b6268', roughness: 0.55, metalness: 0.6 });
  const primer = new MeshStandardMaterial({ color: '#8e4a2a', roughness: 0.7, metalness: 0.3 });
  const sheet = new MeshStandardMaterial({ color: '#8a9399', roughness: 0.45, metalness: 0.55, side: DoubleSide });
  sheet.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vSP;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvSP = position;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vSP;').replace('#include <color_fragment>', '#include <color_fragment>\n float rib = smoothstep(0.75, 1.0, abs(sin(vSP.x * 16.0)));\n diffuseColor.rgb *= 0.9 + rib * 0.18;');
  };
  sheet.customProgramCacheKey = () => 'sheet';
  const frames: Group[] = [], purlins: Group[] = [], sheets: Mesh[] = [];
  const raf = Math.hypot(span / 2, ridge - eave), ang = Math.atan2(ridge - eave, span / 2);
  for (let i = 0; i <= bays; i++) {
    const f = new Group();
    f.position.x = i * bay;
    for (const s of [-1, 1]) {
      f.add(box(0.35, eave, 0.25, steel, 0, eave / 2, (s * span) / 2));
      const r = box(raf, 0.45, 0.22, steel, 0, 0, 0);
      r.position.set(0, (eave + ridge) / 2, (s * span) / 4);
      r.rotation.x = s * ang;
      r.rotation.y = Math.PI / 2;
      f.add(r);
      f.add(box(0.6, 0.1, 0.6, primer, 0, 0.05, (s * span) / 2)); // base plate / pedestal
    }
    root.add(f);
    frames.push(f);
  }
  for (let i = 0; i < bays; i++) {
    const p = new Group();
    for (let k = 0; k < 5; k++) {
      for (const s of [-1, 1]) {
        const t = (k + 0.5) / 5;
        const pz = (s * span) / 2 * (1 - t), py = eave + (ridge - eave) * t + 0.3;
        p.add(box(bay, 0.18, 0.08, primer, i * bay + bay / 2, py, pz));
      }
    }
    root.add(p);
    purlins.push(p);
    for (const s of [-1, 1]) {
      const sh = new Mesh(new PlaneGeometry(bay, raf + 0.3), sheet);
      sh.rotation.x = -Math.PI / 2 + s * ang;
      sh.position.set(i * bay + bay / 2, (eave + ridge) / 2 + 0.42, (s * span) / 4);
      root.add(sh);
      sheets.push(sh);
      if (o.clad !== false) {
        const wall = new Mesh(new PlaneGeometry(bay, eave - 1.2), sheet);
        wall.position.set(i * bay + bay / 2, (eave - 1.2) / 2 + 1.2, (s * span) / 2);
        root.add(wall);
        sheets.push(wall);
      }
    }
  }
  shadows(root);
  return {
    root,
    length: bays * bay,
    span,
    built(t: number) {
      const n = bays + 1;
      frames.forEach((f, i) => { const k = clamp((t / 0.45) * n - i); f.visible = k > 0; f.scale.y = Math.max(0.001, k); });
      purlins.forEach((p, i) => (p.visible = t > 0.45 + (i / bays) * 0.25));
      sheets.forEach((s, i) => (s.visible = t > 0.72 + (Math.floor(i / (o.clad !== false ? 4 : 2)) / bays) * 0.26));
    },
  };
}

/** 6 m site-office / store container. */
export function buildContainer(color = '#4c5a62') {
  const g = new Group();
  const m = addGrain(new MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.4 }), { scale: 2, strength: 0.12 });
  g.add(box(6.06, 2.6, 2.44, m, 0, 1.3 + 0.15, 0));
  const rib = new MeshStandardMaterial({ color: new Color(color).multiplyScalar(0.8), roughness: 0.6, metalness: 0.4 });
  for (let i = 0; i < 20; i++) for (const s of [-1, 1]) g.add(box(0.08, 2.4, 0.04, rib, -2.9 + i * 0.305, 1.45, s * 1.24));
  g.add(box(0.9, 2.0, 0.05, new MeshStandardMaterial({ color: '#2c3236', roughness: 0.6 }), 1.6, 1.15 + 0.15, 1.25));
  g.add(box(1.2, 0.8, 0.05, new MeshPhysicalMaterial({ color: '#0d1519', roughness: 0.05, metalness: 0.3 }), -1.2, 1.7, 1.25));
  for (const x of [-2.6, 2.6]) g.add(box(0.4, 0.15, 2.4, new MeshStandardMaterial({ color: '#555' }), x, 0.075, 0));
  shadows(g);
  return g;
}
