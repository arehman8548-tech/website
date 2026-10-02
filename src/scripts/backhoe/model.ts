/**
 * Procedural backhoe loader.
 *
 * Built from extruded engineering profiles (not boxes) at realistic scale
 * (metres): ~6 m long in travel pose, 1.35 m rear / 1.0 m front tyres,
 * 2.2 m wheelbase. Every moving part is a real joint, and every hydraulic ram
 * is solved between its two mounting pins each frame, so barrels and rods
 * extend and retract exactly as the linkage moves — nothing moves on its own.
 *
 * Machine faces +X. Ground is y = 0.
 */
import {
  BoxGeometry,
  CylinderGeometry,
  Color,
  ExtrudeGeometry,
  Group,
  InstancedMesh,
  LatheGeometry,
  Material,
  Matrix4,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  Quaternion,
  Shape,
  SphereGeometry,
  Vector2,
  Vector3,
} from 'three';

/* ------------------------------------------------------------------ */
/* Materials                                                           */
/* ------------------------------------------------------------------ */
export function makeMaterials() {
  return {
    paint: new MeshPhysicalMaterial({ color: new Color('#b8642c'), roughness: 0.46, metalness: 0.18, clearcoat: 0.35, clearcoatRoughness: 0.4 }),
    paintDark: new MeshStandardMaterial({ color: new Color('#8f4a1f'), roughness: 0.6, metalness: 0.15 }),
    graphite: new MeshStandardMaterial({ color: new Color('#22262a'), roughness: 0.55, metalness: 0.35 }),
    black: new MeshStandardMaterial({ color: new Color('#111315'), roughness: 0.7, metalness: 0.2 }),
    steel: new MeshStandardMaterial({ color: new Color('#5d6064'), roughness: 0.42, metalness: 0.75 }),
    edge: new MeshStandardMaterial({ color: new Color('#9a9c9e'), roughness: 0.3, metalness: 0.9 }),
    chrome: new MeshStandardMaterial({ color: new Color('#d9dcdf'), roughness: 0.16, metalness: 1 }),
    tyre: new MeshStandardMaterial({ color: new Color('#161616'), roughness: 0.92, metalness: 0 }),
    glass: new MeshPhysicalMaterial({ color: new Color('#0d1519'), roughness: 0.06, metalness: 0.2, transparent: true, opacity: 0.5, clearcoat: 1 }),
    lamp: new MeshStandardMaterial({ color: new Color('#fff1d6'), emissive: new Color('#ffcf8a'), emissiveIntensity: 0.6, roughness: 0.2 }),
    beacon: new MeshStandardMaterial({ color: new Color('#e08a4f'), emissive: new Color('#e07a30'), emissiveIntensity: 0.5, roughness: 0.3, transparent: true, opacity: 0.9 }),
  };
}
export type Mats = ReturnType<typeof makeMaterials>;

/* ------------------------------------------------------------------ */
/* Geometry helpers                                                    */
/* ------------------------------------------------------------------ */
type P = [number, number];

function shapeFrom(pts: P[]) {
  const s = new Shape();
  s.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
  s.closePath();
  return s;
}

/** Extrude an XY profile to a given Z depth, centred on z = 0. */
function extrude(pts: P[], depth: number, bevel = 0.012) {
  const g = new ExtrudeGeometry(shapeFrom(pts), {
    depth: depth - bevel * 2,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments: 6,
  });
  g.translate(0, 0, -(depth - bevel * 2) / 2);
  g.computeVertexNormals();
  return g;
}

/** Thicken a polyline into a closed profile (for bucket shells, arms). */
function thick(pts: P[], t0: number, t1 = t0): P[] {
  const n = pts.length;
  const L: P[] = [];
  const R: P[] = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(n - 1, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const t = (t0 + (t1 - t0) * (i / (n - 1))) / 2;
    L.push([pts[i][0] + nx * t, pts[i][1] + ny * t]);
    R.push([pts[i][0] - nx * t, pts[i][1] - ny * t]);
  }
  return [...L, ...R.reverse()];
}

function box(w: number, h: number, d: number, m: Material, x = 0, y = 0, z = 0) {
  const mesh = new Mesh(new BoxGeometry(w, h, d), m);
  mesh.position.set(x, y, z);
  return mesh;
}

/** Cylinder whose axis lies along Z (for pins, hubs). */
function pin(r: number, len: number, m: Material, x = 0, y = 0, z = 0, seg = 16) {
  const g = new CylinderGeometry(r, r, len, seg);
  g.rotateX(Math.PI / 2);
  const mesh = new Mesh(g, m);
  mesh.position.set(x, y, z);
  return mesh;
}

function shadowAll(o: Object3D) {
  o.traverse((c) => {
    if ((c as Mesh).isMesh) {
      c.castShadow = true;
      c.receiveShadow = true;
    }
  });
}

/* ------------------------------------------------------------------ */
/* Hydraulic ram solved between two pins                               */
/* ------------------------------------------------------------------ */
const _a = new Vector3();
const _b = new Vector3();
const _d = new Vector3();
const _q = new Quaternion();
const Z = new Vector3(0, 0, 1);

class Ram {
  barrel: Mesh;
  rod: Mesh;
  constructor(
    private root: Object3D,
    private pa: Object3D,
    private la: Vector3,
    private pb: Object3D,
    private lb: Vector3,
    r: number,
    private barrelLen: number,
    private rodLen: number,
    mats: Mats,
    barrelMat: Material,
  ) {
    const gb = new CylinderGeometry(r, r, barrelLen, 14);
    gb.rotateX(Math.PI / 2);
    gb.translate(0, 0, barrelLen / 2);
    this.barrel = new Mesh(gb, barrelMat);
    const gr = new CylinderGeometry(r * 0.55, r * 0.55, rodLen, 12);
    gr.rotateX(Math.PI / 2);
    gr.translate(0, 0, rodLen / 2);
    this.rod = new Mesh(gr, mats.chrome);
    // eye ends
    this.barrel.add(pin(r * 1.05, r * 2.2, barrelMat, 0, 0, 0, 10));
    this.rod.add(pin(r * 0.9, r * 2, mats.steel, 0, 0, 0, 10));
    for (const m of [this.barrel, this.rod]) {
      m.castShadow = true;
      root.add(m);
    }
  }
  update() {
    this.pa.localToWorld(_a.copy(this.la));
    this.pb.localToWorld(_b.copy(this.lb));
    this.root.worldToLocal(_a);
    this.root.worldToLocal(_b);
    _d.subVectors(_b, _a).normalize();
    _q.setFromUnitVectors(Z, _d);
    this.barrel.position.copy(_a);
    this.barrel.quaternion.copy(_q);
    this.rod.position.copy(_b);
    _d.negate();
    this.rod.quaternion.setFromUnitVectors(Z, _d);
  }
}

/* ------------------------------------------------------------------ */
/* Wheels                                                              */
/* ------------------------------------------------------------------ */
function makeWheel(r: number, w: number, rimR: number, lugs: number, mats: Mats) {
  const g = new Group();
  const hw = w / 2;
  const prof = [
    new Vector2(rimR, -hw * 0.92),
    new Vector2(r * 0.9, -hw),
    new Vector2(r * 0.975, -hw * 0.9),
    new Vector2(r, -hw * 0.66),
    new Vector2(r, hw * 0.66),
    new Vector2(r * 0.975, hw * 0.9),
    new Vector2(r * 0.9, hw),
    new Vector2(rimR, hw * 0.92),
  ];
  const tg = new LatheGeometry(prof, 40);
  tg.rotateX(Math.PI / 2);
  const tyre = new Mesh(tg, mats.tyre);
  g.add(tyre);

  // Chevron tread lugs — they make wheel rotation readable.
  const lugG = new BoxGeometry(0.07, 0.035, hw * 0.95);
  const lug = new InstancedMesh(lugG, mats.tyre, lugs * 2);
  const m = new Matrix4();
  const q = new Quaternion();
  const s = new Vector3(1, 1, 1);
  const p = new Vector3();
  const e = new Object3D();
  let k = 0;
  for (let i = 0; i < lugs; i++) {
    for (const side of [-1, 1]) {
      const a = (i / lugs) * Math.PI * 2 + (side > 0 ? Math.PI / lugs : 0);
      e.position.set(Math.cos(a) * (r + 0.012), Math.sin(a) * (r + 0.012), side * hw * 0.42);
      e.rotation.set(0, 0, a + Math.PI / 2);
      e.rotateY(side * 0.5);
      e.updateMatrix();
      e.matrix.decompose(p, q, s);
      m.compose(p, q, s);
      lug.setMatrixAt(k++, m);
    }
  }
  g.add(lug);

  const rim = pin(rimR, w * 0.86, mats.paint, 0, 0, 0, 28);
  g.add(rim);
  const hubFace = pin(rimR * 0.55, w * 0.9, mats.graphite, 0, 0, 0, 20);
  g.add(hubFace);
  const cap = pin(rimR * 0.22, w * 0.98, mats.steel, 0, 0, 0, 12);
  g.add(cap);
  // wheel nuts
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    g.add(pin(0.022, w * 0.94, mats.edge, Math.cos(a) * rimR * 0.38, Math.sin(a) * rimR * 0.38, 0, 6));
  }
  shadowAll(g);
  return g;
}

/** Lumpy half-dome used for material carried in the buckets. */
function heap() {
  const g = new SphereGeometry(1, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const n = 0.85 + 0.3 * Math.abs(Math.sin(x * 7.1 + z * 5.3) * Math.cos(z * 6.7 - y * 3.1));
    p.setXYZ(i, x * n, y * n, z * n);
  }
  g.computeVertexNormals();
  return g;
}

/* ------------------------------------------------------------------ */
/* Buckets                                                             */
/* ------------------------------------------------------------------ */
function makeLoaderBucket(mats: Mats) {
  const g = new Group();
  const W = 2.3;
  // back wall + floor as one curved shell, open to the front
  const shell: P[] = [
    [-0.02, 0.36], [-0.16, 0.14], [-0.2, -0.12], [-0.15, -0.34], [-0.02, -0.46], [0.2, -0.5], [0.86, -0.5],
  ];
  g.add(new Mesh(extrude(thick(shell, 0.04), W, 0.008), mats.paint));
  // side plates
  const side: P[] = [[-0.02, 0.38], [-0.2, 0.14], [-0.22, -0.13], [-0.16, -0.36], [-0.02, -0.48], [0.2, -0.52], [0.88, -0.52], [0.5, -0.06], [0.16, 0.38]];
  for (const z of [-W / 2 + 0.01, W / 2 - 0.01]) {
    const sp = new Mesh(extrude(side, 0.03, 0.004), mats.paint);
    sp.position.z = z;
    g.add(sp);
  }
  // hardened cutting edge
  g.add(box(0.2, 0.03, W + 0.02, mats.edge, 0.86, -0.5, 0));
  // top spill guard + mounting brackets
  g.add(box(0.12, 0.08, W, mats.paintDark, -0.02, 0.36, 0));
  for (const z of [-0.62, 0.62]) {
    g.add(box(0.18, 0.3, 0.06, mats.graphite, -0.2, 0.08, z));
    g.add(pin(0.05, 0.16, mats.steel, 0, 0, z));
  }
  shadowAll(g);
  return g;
}

function makeHoeBucket(mats: Mats) {
  const g = new Group();
  const W = 0.6;
  // pin at origin, bucket hangs along local +X (continuing the dipper)
  const shell: P[] = [[0.02, 0.2], [0.25, 0.26], [0.5, 0.2], [0.68, 0.02], [0.72, -0.2], [0.62, -0.36]];
  g.add(new Mesh(extrude(thick(shell, 0.035), W, 0.006), mats.paint));
  const side: P[] = [[0.0, 0.2], [0.25, 0.28], [0.52, 0.22], [0.7, 0.03], [0.74, -0.2], [0.62, -0.38], [0.32, -0.12], [0.06, 0.02]];
  for (const z of [-W / 2, W / 2]) {
    const sp = new Mesh(extrude(side, 0.025, 0.004), mats.paint);
    sp.position.z = z;
    g.add(sp);
  }
  // teeth
  for (let i = 0; i < 4; i++) {
    const t = box(0.14, 0.05, 0.07, mats.edge, 0.68, -0.43, -W / 2 + 0.08 + i * ((W - 0.16) / 3));
    t.rotation.z = -1.0;
    g.add(t);
  }
  g.add(pin(0.045, W + 0.08, mats.steel, 0, 0, 0));
  g.add(pin(0.04, W + 0.06, mats.steel, 0.1, 0.24, 0));
  shadowAll(g);
  return g;
}

/* ------------------------------------------------------------------ */
/* Assembly                                                            */
/* ------------------------------------------------------------------ */
export interface Pose {
  x: number; // travel along road (m)
  loaderLift: number; // rad, 0 = bucket on ground
  bucketWorld: number; // loader bucket world angle, 0 = floor level
  boom: number; // rad
  dipper: number; // rad, relative to boom
  hoeBucket: number; // rad, relative to dipper
  swing: number; // rad
  stab: number; // 0 stowed .. 1 deployed
  pitch: number; // body pitch from acceleration
  /* optional — for scenes where the machine drives freely over a site */
  z?: number; // lateral position (m)
  y?: number; // ground height under the machine (m)
  heading?: number; // rad about Y; 0 = facing +X
  steer?: number; // front-wheel steer angle (rad)
  odo?: number; // signed distance travelled, drives wheel roll (defaults to x)
  tilt?: number; // whole-machine pitch on a slope (rad, + = nose up)
  loaderFill?: number; // 0..1 material heaped in the loader bucket
  hoeFill?: number; // 0..1 material in the backhoe bucket
}

export function buildBackhoe(mats: Mats) {
  const root = new Group(); // follows road position
  const body = new Group(); // sprung body (pitch / stabiliser lift)
  root.add(body);

  const R_REAR = 0.68;
  const R_FRONT = 0.5;
  const X_REAR = -0.75;
  const X_FRONT = 1.5;

  /* ---- chassis ---- */
  body.add(box(3.9, 0.36, 0.86, mats.graphite, 0.2, 0.74, 0));
  body.add(box(0.3, 0.38, 1.1, mats.graphite, 2.2, 0.72, 0)); // front bumper / counterweight
  body.add(box(0.18, 0.12, 1.25, mats.paintDark, 2.22, 0.95, 0));
  // side tanks under cab
  for (const z of [-0.78, 0.78]) {
    body.add(box(0.82, 0.38, 0.32, mats.paint, 0.0, 0.82, z));
    body.add(box(0.36, 0.04, 0.3, mats.black, 0.62, 0.5, z)); // step
  }

  /* ---- engine hood ---- */
  const hood = new Mesh(
    extrude([[0.45, 0.92], [2.1, 0.92], [2.2, 1.24], [2.12, 1.52], [1.9, 1.62], [0.45, 1.74]], 1.04, 0.04),
    mats.paint,
  );
  body.add(hood);
  // grille slats
  for (let i = 0; i < 5; i++) body.add(box(0.03, 0.04, 0.78, mats.black, 2.19 - i * 0.012, 1.02 + i * 0.09, 0));
  // headlamps
  for (const z of [-0.42, 0.42]) {
    body.add(box(0.06, 0.1, 0.2, mats.graphite, 2.17, 1.46, z));
    body.add(box(0.02, 0.07, 0.16, mats.lamp, 2.205, 1.46, z));
  }
  // exhaust + pre-cleaner
  const ex = new Mesh(new CylinderGeometry(0.045, 0.05, 0.95, 12), mats.black);
  ex.position.set(0.82, 2.15, 0.34);
  body.add(ex);
  const pc = new Mesh(new CylinderGeometry(0.08, 0.08, 0.36, 14), mats.graphite);
  pc.position.set(0.95, 1.9, -0.32);
  body.add(pc);

  /* ---- fenders ---- */
  const arc = (r0: number, r1: number, a0: number, a1: number): P[] => {
    const o: P[] = [];
    const n = 14;
    for (let i = 0; i <= n; i++) {
      const a = a0 + ((a1 - a0) * i) / n;
      o.push([Math.cos(a) * r1, Math.sin(a) * r1]);
    }
    for (let i = n; i >= 0; i--) {
      const a = a0 + ((a1 - a0) * i) / n;
      o.push([Math.cos(a) * r0, Math.sin(a) * r0]);
    }
    return o;
  };
  for (const z of [-1, 1]) {
    const rf = new Mesh(extrude(arc(R_REAR + 0.1, R_REAR + 0.14, 0.15, Math.PI - 0.25), 0.52, 0.006), mats.paint);
    rf.position.set(X_REAR, R_REAR, z * 0.97);
    body.add(rf);
    const ff = new Mesh(extrude(arc(R_FRONT + 0.08, R_FRONT + 0.12, 0.35, Math.PI - 0.55), 0.36, 0.005), mats.paint);
    ff.position.set(X_FRONT, R_FRONT, z * 0.86);
    body.add(ff);
  }

  /* ---- cab ---- */
  const cab = new Group();
  body.add(cab);
  cab.add(box(1.66, 0.34, 1.48, mats.graphite, -0.37, 1.1, 0)); // floor pan
  const pillars: [number, number][] = [[0.42, 0.7], [0.42, -0.7], [-1.16, 0.7], [-1.16, -0.7], [-0.32, 0.7], [-0.32, -0.7]];
  for (const [x, z] of pillars) cab.add(box(0.07, 1.62, 0.07, mats.graphite, x, 2.06, z));
  // roof with slight overhang and rain gutter
  cab.add(new Mesh(extrude([[-1.3, 2.86], [0.56, 2.86], [0.6, 2.92], [0.52, 2.99], [-1.24, 2.99], [-1.32, 2.93]], 1.62, 0.02), mats.graphite));
  cab.add(box(1.5, 1.52, 1.36, mats.glass, -0.37, 2.04, 0));
  // seat + steering (silhouette through glass)
  cab.add(box(0.5, 0.12, 0.5, mats.black, -0.55, 1.62, 0));
  cab.add(box(0.12, 0.6, 0.5, mats.black, -0.8, 1.95, 0));
  const steer = new Mesh(new CylinderGeometry(0.17, 0.17, 0.03, 18), mats.black);
  steer.position.set(0.1, 1.9, 0);
  steer.rotation.z = 0.9;
  cab.add(steer);
  // roof beacon + work lamps
  const bc = new Mesh(new CylinderGeometry(0.07, 0.08, 0.12, 14), mats.beacon);
  bc.position.set(-0.5, 3.06, -0.5);
  cab.add(bc);
  for (const z of [-0.6, 0.6]) {
    cab.add(box(0.08, 0.08, 0.14, mats.lamp, 0.6, 2.9, z));
    cab.add(box(0.08, 0.08, 0.14, mats.lamp, -1.34, 2.9, z));
  }
  // grab handles
  for (const z of [-0.76, 0.76]) {
    const h = new Mesh(new CylinderGeometry(0.018, 0.018, 1.1, 8), mats.black);
    h.position.set(0.48, 1.85, z);
    cab.add(h);
  }

  /* ---- rear frame + backhoe mount ---- */
  body.add(box(0.7, 0.62, 1.3, mats.graphite, -1.62, 0.95, 0));
  body.add(box(0.12, 0.5, 1.9, mats.paint, -1.95, 1.0, 0)); // cross beam carrying stabilisers

  /* ---- wheels ---- */
  const wheels: { g: Group; r: number }[] = [];
  const knuckles: Group[] = [];
  for (const z of [-0.97, 0.97]) {
    const rw = makeWheel(R_REAR, 0.46, 0.4, 22, mats);
    rw.position.set(X_REAR, R_REAR, z);
    root.add(rw);
    wheels.push({ g: rw, r: R_REAR });
    // front wheels hang on steering knuckles
    const kn = new Group();
    kn.position.set(X_FRONT, R_FRONT, z * 0.86);
    root.add(kn);
    knuckles.push(kn);
    const fw = makeWheel(R_FRONT, 0.32, 0.28, 18, mats);
    kn.add(fw);
    wheels.push({ g: fw, r: R_FRONT });
  }

  /* ---- front loader ---- */
  const loaderPivot = new Vector3(0.2, 1.42, 0);
  const loader = new Group();
  loader.position.copy(loaderPivot);
  body.add(loader);
  const armProfile = thick([[0, 0], [0.8, 0.12], [1.6, 0.14], [2.15, -0.42], [2.5, -0.97]], 0.2, 0.15);
  const arms: Mesh[] = [];
  for (const z of [-0.64, 0.64]) {
    const a = new Mesh(extrude(armProfile, 0.1, 0.012), mats.paint);
    a.position.z = z;
    loader.add(a);
    arms.push(a);
    loader.add(pin(0.06, 0.16, mats.steel, 0, 0, z));
    body.add(box(0.26, 0.5, 0.09, mats.graphite, 0.2, 1.22, z)); // pivot tower
  }
  loader.add(box(0.12, 0.12, 1.24, mats.paintDark, 1.75, 0.08, 0)); // cross tube
  const bucketPin = new Vector3(2.5, -0.97, 0);
  const lBucket = makeLoaderBucket(mats);
  lBucket.position.copy(bucketPin);
  loader.add(lBucket);
  const soilMat = new MeshStandardMaterial({ color: new Color('#6b5240'), roughness: 1, flatShading: true });
  const lFill = new Mesh(heap(), soilMat);
  lFill.position.set(0.36, -0.46, 0);
  lFill.scale.set(0.5, 0.45, 1.05);
  lBucket.add(lFill);

  /* ---- backhoe ---- */
  const hoe = new Group(); // local +X points backward
  hoe.position.set(-2.12, 1.0, 0);
  hoe.rotation.y = Math.PI;
  body.add(hoe);
  const swing = new Group();
  hoe.add(swing);
  swing.add(box(0.42, 1.0, 0.5, mats.graphite, 0.12, 0.12, 0)); // kingpost
  swing.add(pin(0.12, 0.62, mats.steel, 0.0, 0.5, 0));
  swing.add(pin(0.12, 0.62, mats.steel, 0.0, -0.3, 0));

  const boomPivot = new Vector3(0.28, 0.42, 0);
  const boom = new Group();
  boom.position.copy(boomPivot);
  swing.add(boom);
  const BOOM_L = 2.55;
  boom.add(new Mesh(extrude(thick([[0, 0], [0.55, 0.2], [1.15, 0.34], [1.9, 0.22], [BOOM_L, 0]], 0.36, 0.22), 0.26, 0.02), mats.paint));
  boom.add(pin(0.07, 0.34, mats.steel, 0, 0, 0));

  const dipper = new Group();
  dipper.position.set(BOOM_L, 0, 0);
  boom.add(dipper);
  const DIP_L = 1.9;
  dipper.add(new Mesh(extrude(thick([[-0.38, 0.12], [0, 0], [0.9, -0.02], [DIP_L, 0]], 0.2, 0.15), 0.2, 0.015), mats.paint));
  dipper.add(pin(0.065, 0.3, mats.steel, 0, 0, 0));
  // bucket link plates
  const hBucket = makeHoeBucket(mats);
  hBucket.position.set(DIP_L, 0, 0);
  dipper.add(hBucket);
  const hFill = new Mesh(heap(), soilMat);
  // dome faces out of the bucket mouth
  hFill.position.set(0.34, -0.18, 0);
  hFill.rotation.z = 2.52;
  hFill.scale.set(0.3, 0.26, 0.27);
  hBucket.add(hFill);

  /* ---- stabilisers ---- */
  const stabs: Group[] = [];
  for (const side of [-1, 1]) {
    const s = new Group();
    s.position.set(-1.98, 1.12, side * 0.92);
    body.add(s);
    const leg = new Group();
    s.add(leg);
    leg.add(box(0.2, 1.3, 0.18, mats.paint, 0, -0.62, 0));
    leg.add(box(0.12, 0.5, 0.12, mats.chrome, 0, -1.25, 0));
    const pad = box(0.42, 0.06, 0.34, mats.steel, 0, -1.5, 0);
    leg.add(pad);
    s.userData.side = side;
    stabs.push(s);
    s.add(pin(0.07, 0.24, mats.steel, 0, 0, 0));
  }

  /* ---- rams ---- */
  const rams: Ram[] = [];
  for (const z of [-0.64, 0.64]) {
    rams.push(new Ram(body, body, new Vector3(0.95, 0.98, z), loader, new Vector3(1.05, -0.08, z), 0.06, 0.62, 0.62, mats, mats.paintDark));
  }
  // bucket tilt ram (centre)
  rams.push(new Ram(body, loader, new Vector3(1.3, 0.22, 0), lBucket, new Vector3(-0.02, 0.4, 0), 0.06, 0.62, 0.56, mats, mats.paintDark));
  // boom ram: kingpost low → boom belly
  rams.push(new Ram(body, swing, new Vector3(0.2, -0.32, 0), boom, new Vector3(1.05, 0.05, 0), 0.075, 0.8, 0.82, mats, mats.paintDark));
  // dipper ram: boom top → dipper lever
  rams.push(new Ram(body, boom, new Vector3(0.75, 0.42, 0), dipper, new Vector3(-0.38, 0.14, 0), 0.07, 1.0, 1.0, mats, mats.paintDark));
  // bucket ram: dipper top → bucket link
  rams.push(new Ram(body, dipper, new Vector3(0.12, 0.13, 0), hBucket, new Vector3(0.1, 0.24, 0), 0.055, 0.85, 0.85, mats, mats.paintDark));

  shadowAll(body);

  const STAB_STOW = 2.75; // leg folded up and slightly outboard; swings outward, never through the body
  function apply(p: Pose) {
    root.position.set(p.x, p.y ?? 0, p.z ?? 0);
    root.rotation.set(0, p.heading ?? 0, p.tilt ?? 0, 'YXZ');
    const odo = p.odo ?? p.x;
    for (const w of wheels) w.g.rotation.z = -odo / w.r;
    for (const k of knuckles) k.rotation.y = p.steer ?? 0;
    const lf = p.loaderFill ?? 0, hf = p.hoeFill ?? 0;
    lFill.visible = lf > 0.02;
    lFill.scale.set(0.5, 0.45 * lf, 1.05);
    hFill.visible = hf > 0.02;
    hFill.scale.set(0.3, 0.26 * hf, 0.27);
    // stabilisers: rotate about X so the leg swings outward and down
    const deployAngle = 0.42;
    for (const s of stabs) {
      const side = s.userData.side as number;
      const a = STAB_STOW + (deployAngle - STAB_STOW) * p.stab;
      s.rotation.x = side * -a;
    }
    // once pads touch, the rear lifts slightly off the tyres
    const lift = Math.max(0, p.stab - 0.82) / 0.18;
    body.position.y = lift * 0.05;
    body.rotation.z = p.pitch - lift * 0.012;
    loader.rotation.z = p.loaderLift;
    lBucket.rotation.z = p.bucketWorld - p.loaderLift;
    swing.rotation.y = p.swing;
    boom.rotation.z = p.boom;
    dipper.rotation.z = p.dipper;
    hBucket.rotation.z = p.hoeBucket;
    root.updateMatrixWorld(true);
    for (const r of rams) r.update();
  }

  const TIP = new Vector3(0.7, -0.47, 0);
  const EDGE = new Vector3(0.9, -0.5, 0);
  return {
    root,
    body,
    apply,
    hoeBucketTip: hBucket,
    /** World position of the backhoe bucket teeth. */
    hoeTip: (out = new Vector3()) => hBucket.localToWorld(out.copy(TIP)),
    /** World position of the loader bucket cutting edge. */
    loaderEdge: (out = new Vector3()) => lBucket.localToWorld(out.copy(EDGE)),
  };
}

export type Backhoe = ReturnType<typeof buildBackhoe>;

/* ------------------------------------------------------------------ */
/* Backhoe inverse kinematics                                          */
/* ------------------------------------------------------------------ */
/** Linkage geometry in the machine frame (metres): boom pivot sits 2.40 m behind and 1.42 m above the root. */
export const HOE = { back: 2.4, up: 1.42, L1: 2.55, L2: 1.9, tip: [0.7, -0.47] as const };

/**
 * Solve boom/dipper/bucket angles so the bucket teeth reach a point `back`
 * metres behind the machine origin and `h` metres above its ground, with the
 * bucket held at world angle `phi` (−π/2: teeth straight down; −π: curled
 * full; ~0: dumping). Out-of-reach targets are clamped to the envelope.
 */
export function hoeIK(back: number, h: number, phi: number, lift = 0) {
  const [tx, ty] = HOE.tip;
  // bucket pin = tip − R(phi)·tip
  const px = back - HOE.back - (tx * Math.cos(phi) - ty * Math.sin(phi));
  const py = h - HOE.up - lift - (tx * Math.sin(phi) + ty * Math.cos(phi));
  const { L1, L2 } = HOE;
  let d2 = px * px + py * py;
  const maxR = (L1 + L2) * 0.995, minR = Math.abs(L1 - L2) * 1.01;
  let x = px, y = py;
  const r = Math.sqrt(d2);
  if (r > maxR || r < minR) { const k = (r > maxR ? maxR : minR) / (r || 1); x *= k; y *= k; d2 = x * x + y * y; }
  const c = Math.min(1, Math.max(-1, (d2 - L1 * L1 - L2 * L2) / (2 * L1 * L2)));
  const dipper = -Math.acos(c); // elbow up: boom rises, dipper hangs down
  const boom = Math.atan2(y, x) - Math.atan2(L2 * Math.sin(dipper), L1 + L2 * Math.cos(dipper));
  return { boom, dipper, hoeBucket: phi - boom - dipper };
}
