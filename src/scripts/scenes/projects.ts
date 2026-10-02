/**
 * Project Solutions — one cinematic work set per project type. Reading an
 * article drives its set: the machine does that project's actual work while
 * the camera moves through the site. Sets cut between each other like shots.
 *
 *  0 Road construction   hill road: side drain cut along the widened edge
 *  1 Hill cutting        benching a slope: the cut face retreats, spoil at the toe
 *  2 Site development    terraced plot: loader back-fills behind a retaining wall
 *  3 Dam / bridge        river bank: abutment pit beside a live river, gabions
 *  4 Trenching           town road: utility trench, pipes, barricades, buildings
 *  5 Infrastructure      industrial plot: grading while a portal-frame shed rises
 */
import { BoxGeometry, Color, CylinderGeometry, FogExp2, Group, InstancedMesh, Mesh, MeshStandardMaterial, Object3D, PerspectiveCamera, Vector3, Vector4 } from 'three';
import {
  addGrain, clamp, createRenderer, Dust, Excavation, fbm, ground, hash, heightfield, lerp, makeBarricade, makeCones, makeForest, makeGabions,
  makeHeap, makeLights, makeLimeOutline, makePipes, makeRebarCage, makeRidges, makeRocks, makeRoad, makeSky, makeWater, orbit, pathTrack,
  seg, soil, sstep, track, yieldToMain, type Ctx,
} from '../three/kit';
import { buildContainer, buildShed, buildTipper, vehicleMats } from '../three/vehicles';
import { buildBackhoe, hoeIK, makeMaterials, type Backhoe, type Pose } from '../backhoe/model';
import type { Factory } from '../stage/runtime';

const PI = Math.PI;
const SPACING = 1400; // sets live far apart; fog and visibility keep one on screen
type Cam = number[]; // [t, az, el, dist, tx, ty, tz]

interface SetState {
  group: Group;
  cam: Cam[];
  pose(t: number): Pose;
  update(t: number, dt: number, m: Backhoe, dust: Dust): void;
  ambient?: boolean;
  sunDir?: Vector3;
}

const BASE_POSE: Pose = { x: 0, loaderLift: 0.18, bucketWorld: 0.3, boom: 1.18, dipper: -2.72, hoeBucket: -1.7, swing: 0, stab: 0, pitch: 0 };

/** A dig cycle: [t, back, h, phi, swing, fill] keys around a target. */
function digKeys(B: number, d0: number, d1: number, sw: number, dumpSw: number, dumpH = 1.9, reach = 1.0) {
  return [
    [0.0, B + reach, 1.0, -1.2, sw, 0],
    [0.16, B + reach, -d0 + 0.05, -1.35, sw, 0],
    [0.44, B - reach * 0.8, -d1, -2.45, sw, 0.6],
    [0.56, B - reach * 0.6, 0.9, -3.05, sw, 1],
    [0.7, B - 0.1, dumpH, -3.05, dumpSw, 1],
    [0.83, B - 0.1, dumpH, -0.25, dumpSw, 0],
    [1.0, B + reach, 1.0, -1.2, sw, 0],
  ];
}
/** Backhoe working pose for `n` cycles over t∈[a,b], deepening an excavation to `depth`. */
function digging(t: number, a: number, b: number, n: number, B: number, depth: number, sws: number[], dumpSw: number, lift = 0.05) {
  const k = seg(t, a, b) * n;
  const i = Math.min(n - 1, Math.floor(k));
  const local = t >= b ? 1 : k - i;
  const d0 = (i * depth) / n, d1 = ((i + 1) * depth) / n;
  const [back, h, phi, swing, fill] = track(digKeys(B, d0, d1, sws[i % sws.length], dumpSw), local);
  const ik = hoeIK(back, h, phi, lift);
  const dug = t < a ? 0 : t >= b ? depth : lerp(d0, d1, sstep(0.16, 0.44, local));
  return { ...ik, swing, hoeFill: fill, dug, cycle: i, local };
}
function unfolded(t: number, a: number, b: number, B: number, lift = 0.05) {
  const r = hoeIK(B + 1, 1, -1.2, lift);
  const u = sstep(a, b, t);
  return { boom: lerp(1.18, r.boom, u), dipper: lerp(-2.72, r.dipper, u), hoeBucket: lerp(-1.7, r.hoeBucket, u) };
}

function colorHill(base: string, dark: string) {
  const a = new Color(base), b = new Color(dark);
  return (c: Color, n: number) => c.copy(a).lerp(b, n);
}
const FOREST = new Color('#2a3528'), FOREST2 = new Color('#37422f'), CUT_A = new Color('#946f4e'), CUT_B = new Color('#6a5340'), ROCK = new Color('#7f7b73'), GRASS = new Color('#4a5737'), SCRUB = new Color('#585b42');
function strata(c: Color, h: number, n: number) {
  const band = (Math.sin(h * 5.2 + n * 2.6) + 1) / 2;
  return c.copy(CUT_A).lerp(CUT_B, band).lerp(ROCK, n > 0.6 ? 0.5 : 0);
}
function forestOn(ctx: Ctx, n: number, x0: number, x1: number, z0: number, z1: number, h: (x: number, z: number) => number, ok = (_x: number, _z: number) => true, seed = 0) {
  return makeForest(ctx.lite ? Math.round(n * 0.45) : n, (i) => {
    const x = x0 + hash(i + seed, 1) * (x1 - x0), z = z0 + hash(i + seed, 2) * (z1 - z0);
    if (!ok(x, z) || fbm(x * 0.05 + seed, z * 0.05) < 0.4) return null;
    return [x, h(x, z), z, 1.4 + hash(i, 5) * 1.6];
  });
}

/* ================================================================== */
/* 0 · Road construction — side drain along a widened hill road       */
/* ================================================================== */
function setRoad(ctx: Ctx, vm: ReturnType<typeof vehicleMats>): SetState {
  const g = new Group();
  const h = (x: number, z: number) => {
    const n = fbm(x * 0.06 + 3, z * 0.06);
    if (z < -5.1) { const d = -5.1 - z; return 6.5 * sstep(0, 1.4, d) + d * 0.62 + (n - 0.5) * Math.min(d, 14) * 0.6; }
    if (z > 3.9) { const d = z - 3.9; return -26 * (1 - Math.exp(-d / 16)) + (n - 0.5) * Math.min(d, 8) * 0.4; }
    return 0;
  };
  const hole = new Vector4(0, -4.05, -1, -1);
  g.add(heightfield({ w: 220, d: 120, cz: -10, res: ctx.lite ? 1.4 : 0.8 }, h, (x, z, y, sl, c) => {
    const n = fbm(x * 0.2, z * 0.2, 3);
    if (z < -5.1) return sl > 0.4 && z > -8.4 ? strata(c, y, n) : c.copy(FOREST).lerp(FOREST2, n);
    if (z > 3.9) return c.copy(GRASS).lerp(SCRUB, n).lerp(FOREST, sstep(4, 16, z - 3.9) * 0.6);
    return c.set('#6f6658').lerp(new Color('#58514a'), n * 0.6);
  }, ground([hole])));
  const road: Vector3[] = [];
  for (let x = -110; x <= 110; x += 4) road.push(new Vector3(x, 0, -0.1));
  g.add(makeRoad(road, 6.4));
  // parapets on the valley side, painted black and white
  const pg = new BoxGeometry(0.9, 0.55, 0.32);
  const par = new InstancedMesh(pg, new MeshStandardMaterial({ color: '#cfcac0', roughness: 0.85 }), 60);
  const o = new Object3D();
  for (let i = 0; i < 60; i++) { o.position.set(-90 + i * 3, 0.27, 3.75); o.updateMatrix(); par.setMatrixAt(i, o.matrix); }
  par.castShadow = true;
  g.add(par);
  g.add(forestOn(ctx, 900, -100, 110, -70, -8, h, (_x, z) => z < -9));
  g.add(forestOn(ctx, 500, -100, 110, 9, 60, h, (_x, z) => z > 9, 7));
  g.add(makeRocks(30, (i) => { const x = -30 + hash(i, 3) * 50, z = -5.2 - hash(i, 4) * 0.5; return Math.abs(x) < 4 ? null : [x, 0.05, z, 0.15 + hash(i, 5) * 0.3]; }));
  const drain = new Excavation(7, 0.84, 0.9, '#6e5643', '#4a3a2c');
  drain.grp.position.set(0, 0, -4.05);
  g.add(drain.grp);
  const spoil = makeHeap('#705745', 3, 0.6);
  g.add(spoil);
  g.add(makeCones([[-6, -2.6], [-3, -2.6], [3, -2.6], [6, -2.6], [9, -2.4], [-9, -2.4], [12, -1.4], [-12, -1.4]]));
  g.add(makeBarricade(-14.5, 0.8, PI / 2, 2.6));
  const tip = buildTipper(vm);
  tip.root.position.set(-13, 0, 1.4);
  tip.fill(0.55);
  g.add(tip.root);

  const B = 3.7, z0 = -4.05 + B;
  const sws = [0.0, -0.32, 0.32, 0.0];
  let spoilAt = new Vector3();
  let measured = false;
  return {
    group: g,
    cam: [[0, 92, 16, 26, 0, 2.2, -2.5], [0.35, 72, 22, 20, 0, 1.2, -3], [0.7, 30, 30, 16, 0, 0.2, -3.6], [1, 112, 30, 24, -2, 1, -3]],
    pose(t) {
      const lift = 0.05;
      const st = sstep(0.05, 0.16, t);
      const d = t < 0.2 ? unfolded(t, 0.12, 0.22, B, lift) : digging(t, 0.22, 0.95, 4, B, 0.9, sws, 1.25, lift);
      return { ...BASE_POSE, x: 0, z: z0, heading: -PI / 2, stab: st, ...d };
    },
    update(t, _dt, m, dust) {
      const p = this.pose(t) as Pose & { dug?: number; local?: number };
      const dug = p.dug ?? 0;
      drain.set(dug);
      hole.z = dug > 0.004 ? 3.5 : -1; hole.w = dug > 0.004 ? 0.42 : -1;
      if (!measured) {
        m.apply({ ...p, ...hoeIK(B - 0.1, 1.9, -0.25, 0.05), swing: 1.25 });
        spoilAt = m.hoeTip().sub(g.position);
        measured = true;
      }
      spoil.position.set(spoilAt.x, 0, spoilAt.z);
      const f = clamp(dug / 0.9);
      spoil.visible = f > 0.03;
      spoil.scale.set(0.6 + f * 1.2, 0.4 + f * 0.6, 0.6 + f * 0.9);
      if (p.local !== undefined && p.local > 0.16 && p.local < 0.44) { const tp = m.hoeTip(); dust.emit(tp.x, 0.1, tp.z, 1, 0.5, 0.5, 1.0); }
    },
  };
}

/* ================================================================== */
/* 1 · Hill cutting — benching a slope                                 */
/* ================================================================== */
function setHill(ctx: Ctx): SetState {
  const g = new Group();
  const FINAL = -4.2; // final toe of the bench cut
  const h = (x: number, z: number) => {
    const n = fbm(x * 0.05 + 11, z * 0.05);
    if (z > 7) { const d = z - 7; return -20 * (1 - Math.exp(-d / 14)) + (n - 0.5) * Math.min(d, 6) * 0.4; }
    if (z > FINAL) return 0; // working bench
    if (z > -9) return 3.2 * sstep(FINAL, FINAL - 0.6, z); // upper bench at 3.2 m
    const d = -9 - z;
    return 3.2 + 3.4 * sstep(0, 0.9, d) + (d > 0.9 ? (d - 0.9) * 0.7 + (n - 0.5) * Math.min(d, 14) * 0.6 : 0);
  };
  g.add(heightfield({ w: 200, d: 120, cz: -12, res: ctx.lite ? 1.4 : 0.7 }, h, (x, z, y, sl, c) => {
    const n = fbm(x * 0.2, z * 0.2, 3);
    if (sl > 0.45 && z < 0 && z > -12) return strata(c, y, n);
    if (z < -12) return c.copy(FOREST).lerp(FOREST2, n);
    if (z > 7) return c.copy(GRASS).lerp(SCRUB, n);
    return c.set('#7d6a55').lerp(new Color('#5e4f40'), n * 0.7);
  }));
  // the uncut block: its face retreats from z = −0.6 to the final toe as the bench is cut
  const blockMat = addGrain(new MeshStandardMaterial({ color: '#8a6a4c', roughness: 1 }), { scale: 2.2, strength: 0.4 });
  const block = new Mesh(new BoxGeometry(12, 3.2, 1, 24, 8, 2), blockMat);
  const bp = block.geometry.attributes.position;
  for (let i = 0; i < bp.count; i++) if (bp.getZ(i) > 0.4) bp.setZ(i, 0.5 + (fbm(bp.getX(i) * 1.3, bp.getY(i) * 1.6) - 0.5) * 0.35);
  block.geometry.computeVertexNormals();
  block.castShadow = true; block.receiveShadow = true;
  g.add(block);
  const toe = makeHeap('#7a5e47', 8, 0.5);
  g.add(toe);
  // stone breast wall finished on the bench above
  const wall = new Mesh(new BoxGeometry(16, 1.2, 0.5), addGrain(new MeshStandardMaterial({ color: '#8b877c', roughness: 0.95 }), { scale: 7, strength: 0.5 }));
  wall.position.set(-17, 3.8, -8.9);
  wall.castShadow = true;
  g.add(wall);
  g.add(makeLimeOutline([[-14, 5.5], [14, 5.5]], 0.012, 0.1));
  g.add(forestOn(ctx, 800, -100, 100, -70, -13, h, (_x, z) => z < -13, 3));
  g.add(forestOn(ctx, 400, -100, 100, 12, 60, h, (_x, z) => z > 12, 9));
  g.add(makeRocks(26, (i) => { const x = -12 + hash(i, 6) * 24, z = -0.4 + hash(i, 7) * 2.5; return [x, 0.05, z, 0.12 + hash(i, 8) * 0.25]; }));
  g.add(makeCones([[-7, 5], [7, 5], [-9, 2], [9, 2]]));

  const z0 = 3.4;
  return {
    group: g,
    cam: [[0, 96, 14, 28, 0, 2.6, -1.5], [0.4, 72, 20, 21, 0, 1.8, -1.5], [0.75, 112, 24, 19, 0, 1.6, -1.5], [1, 88, 32, 30, 0, 2.4, -4]],
    pose(t) {
      const lift = 0.05;
      const face = lerp(-0.6, FINAL + 0.4, sstep(0.22, 0.95, t));
      const B = z0 - face;
      const st = sstep(0.05, 0.16, t);
      if (t < 0.22) return { ...BASE_POSE, x: 0, z: z0, heading: -PI / 2, stab: st, ...unfolded(t, 0.12, 0.22, B - 0.6, lift) };
      // pulling down the face: bite high, drag down the face to the toe, push spoil to the side
      const k = seg(t, 0.22, 0.95) * 4, i = Math.min(3, Math.floor(k)), lt = t >= 0.95 ? 1 : k - i;
      const sw = [0.22, -0.22, 0.05, -0.1][i];
      const [back, hh, phi, swing, fill] = track([
        [0, B + 0.6, 3.6, -1.0, sw, 0],
        [0.2, B + 0.25, 2.8, -1.4, sw, 0.2],
        [0.5, B - 0.3, 0.4, -2.3, sw, 0.8],
        [0.62, B - 1.1, 1.2, -3.0, sw, 1],
        [0.78, B - 1.4, 1.4, -3.0, sw + 0.9, 1],
        [0.88, B - 1.4, 1.2, -0.3, sw + 0.9, 0],
        [1, B + 0.6, 3.6, -1.0, sw, 0],
      ], lt);
      return { ...BASE_POSE, x: 0, z: z0, heading: -PI / 2, stab: st, swing, hoeFill: fill, ...hoeIK(back, hh, phi, lift) };
    },
    update(t, _dt, m, dust) {
      const face = lerp(-0.6, FINAL + 0.4, sstep(0.22, 0.95, t));
      const depth = face - FINAL; // remaining block thickness
      block.scale.z = Math.max(0.01, depth);
      block.position.set(0, 1.6, (FINAL + face) / 2);
      block.visible = depth > 0.02;
      const f = sstep(0.22, 0.95, t);
      toe.visible = f > 0.02;
      toe.position.set(1.2, 0, face + 1.6);
      toe.scale.set(1 + f * 2.2, 0.5 + f * 0.9, 0.8 + f * 0.9);
      const tp = m.hoeTip();
      if (t > 0.22 && t < 0.95 && tp.y > 0.3 && tp.y < 3.2) dust.emit(tp.x, tp.y - 0.3, tp.z, 1, 0.6, -0.1, 1.2);
    },
  };
}

/* ================================================================== */
/* 2 · Site development — back-filling behind a retaining wall         */
/* ================================================================== */
function setSite(ctx: Ctx): SetState {
  const g = new Group();
  const WALL_Z = -3.2, CUT_Z = -5.6, TOP = 2.2;
  const h = (x: number, z: number) => {
    const n = fbm(x * 0.05 + 21, z * 0.05);
    if (z > 13) { const d = z - 13; return -18 * (1 - Math.exp(-d / 14)) + (n - 0.5) * Math.min(d, 6) * 0.4; }
    if (z > WALL_Z) return 0;
    if (z > CUT_Z) return 0; // the gap behind the wall, filled by the scene
    if (z > -26) return TOP; // upper terrace
    const d = -26 - z;
    return TOP + d * 0.55 + (n - 0.5) * Math.min(d, 12) * 0.6;
  };
  g.add(heightfield({ w: 180, d: 120, cz: -12, res: ctx.lite ? 1.4 : 0.8 }, h, (x, z, y, sl, c) => {
    const n = fbm(x * 0.2, z * 0.2, 3);
    if (sl > 0.5) return strata(c, y, n);
    if (z < -26) return c.copy(FOREST).lerp(FOREST2, n);
    if (z > 13) return c.copy(GRASS).lerp(SCRUB, n);
    return c.set('#7c6c58').lerp(new Color('#5f5446'), n * 0.7);
  }));
  // random-rubble stone retaining wall
  const stone = addGrain(new MeshStandardMaterial({ color: '#8e897e', roughness: 0.95 }), { scale: 6, strength: 0.55 });
  const wall = new Mesh(new BoxGeometry(16, TOP + 0.3, 0.6), stone);
  wall.position.set(0, (TOP + 0.3) / 2, WALL_Z - 0.3);
  wall.castShadow = true; wall.receiveShadow = true;
  g.add(wall);
  // weep holes
  for (let i = 0; i < 7; i++) { const w = new Mesh(new CylinderGeometry(0.05, 0.05, 0.62, 8), new MeshStandardMaterial({ color: '#2b2d2f' })); w.rotation.x = PI / 2; w.position.set(-6 + i * 2, 0.6, WALL_Z - 0.3); g.add(w); }
  // cut face behind the gap
  const cut = new Mesh(new BoxGeometry(16, TOP, 0.4), addGrain(new MeshStandardMaterial({ color: '#8a6a4c', roughness: 1 }), { scale: 2.5, strength: 0.4 }));
  cut.position.set(0, TOP / 2, CUT_Z - 0.2);
  g.add(cut);
  const fill = new Mesh(new BoxGeometry(15.8, 1, 1.8), soil('#6d5644', { scale: 3, strength: 0.4 }));
  fill.position.set(0, 0, (WALL_Z - 0.6 + CUT_Z) / 2);
  fill.receiveShadow = true;
  g.add(fill);
  // building frame starting on the upper terrace: columns with starter bars
  const conc = addGrain(new MeshStandardMaterial({ color: '#a7a399', roughness: 0.9 }), { scale: 4, strength: 0.18 });
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
    const cx = -9 + i * 4.2, cz = -10 - j * 4.2;
    const col = new Mesh(new BoxGeometry(0.35, 3, 0.35), conc);
    col.position.set(cx, TOP + 1.5, cz);
    col.castShadow = true;
    g.add(col);
    const bars = makeRebarCage(0.3, 1.2);
    bars.position.set(cx, TOP + 3, cz);
    g.add(bars);
  }
  const beam = new Mesh(new BoxGeometry(12.9, 0.4, 0.3), conc);
  beam.position.set(-2.7, TOP + 0.2, -10);
  g.add(beam);
  const office = buildContainer('#6b5f4b');
  office.position.set(14, TOP, -12);
  g.add(office);
  const pile = makeHeap('#6d5441', 4, 0.55);
  pile.position.set(12.5, 0, 3.2);
  g.add(pile);
  g.add(forestOn(ctx, 700, -90, 90, -70, -28, h, (_x, z) => z < -28, 13));
  g.add(forestOn(ctx, 400, -90, 90, 16, 60, h, (_x, z) => z > 16, 2));

  const path = pathTrack([
    [0, 6.4, 3.2, 0], [0.12, 6.4, 3.2, 0],
    [0.24, 8.3, 3.2, 0], [0.3, 8.3, 3.2, 0], // into the pile
    [0.42, 4.5, 2.2, PI * 0.28], // reverse and swing round
    [0.56, 1.4, 2.4, PI / 2],
    [0.62, 1.4, -0.5, PI / 2], // up to the wall
    [0.76, 1.4, -0.5, PI / 2],
    [0.88, 1.4, 2.6, PI / 2], // back off
    [1, 1.4, 2.6, PI / 2],
  ]);
  return {
    group: g,
    cam: [[0, 58, 14, 28, 4, 1.6, 0], [0.3, 72, 18, 24, 5, 1.4, 0], [0.62, 40, 20, 19, 1, 1.8, -2], [1, 76, 30, 34, -2, 2.4, -7]],
    pose(t) {
      const m = path(t);
      const [loaderLift, bucketWorld, loaderFill] = track([
        [0, 0.18, 0.3, 0], [0.14, 0.0, -0.05, 0], [0.26, 0.0, -0.02, 0.4], [0.3, 0.05, 0.42, 1],
        [0.42, 0.25, 0.42, 1], [0.6, 1.0, 0.36, 1], [0.68, 1.0, 0.36, 1], [0.74, 1.0, -0.85, 0], [0.86, 0.4, 0.2, 0], [1, 0.18, 0.3, 0],
      ], t);
      return { ...BASE_POSE, x: m.x, z: m.z, heading: m.heading, odo: m.odo, steer: m.steer, loaderLift, bucketWorld, loaderFill, pitch: clamp(-m.speed * 0.0004, -0.012, 0.012) };
    },
    update(t, _dt, m, dust) {
      const f = 0.45 + sstep(0.7, 0.76, t) * 0.5;
      fill.scale.y = f;
      fill.position.y = f / 2;
      pile.scale.set(3.2 * (1 - sstep(0.24, 0.3, t) * 0.15), 2.0, 2.8);
      if (t > 0.7 && t < 0.75) { const e = m.loaderEdge(); dust.emit(e.x, 2.0, e.z, 3, 1.0, -0.3, 1.6); }
      if (t > 0.24 && t < 0.3) { const e = m.loaderEdge(); dust.emit(e.x, 0.3, e.z, 2, 0.8, 0.4, 1.4); }
    },
  };
}

/* ================================================================== */
/* 3 · Dam / bridge / river — abutment pit beside a live river         */
/* ================================================================== */
function setRiver(ctx: Ctx): SetState {
  const g = new Group();
  const BED = -3.2;
  const h = (x: number, z: number) => {
    const n = fbm(x * 0.05 + 31, z * 0.05);
    if (z < 2) { if (Math.abs(x) < 4 && z > -60) return 0; const d = Math.max(0, -10 - z); return (Math.abs(x) < 4 ? 0 : sstep(4, 7, Math.abs(x)) * 0.4) + d * 0.35 + (n - 0.5) * Math.min(d + 1, 10) * 0.6; }
    if (z < 7) return lerp(0, BED, sstep(2, 7, z));
    if (z < 21) return BED + (n - 0.5) * 0.3;
    if (z < 25) return lerp(BED, 0.4, sstep(21, 25, z));
    const d = z - 25;
    return 0.4 + d * 0.5 + (n - 0.5) * Math.min(d, 10) * 0.6;
  };
  const hole = new Vector4(0, 0.2, -1, -1);
  g.add(heightfield({ w: 200, d: 140, cz: 5, res: ctx.lite ? 1.4 : 0.8 }, h, (x, z, y, sl, c) => {
    const n = fbm(x * 0.2, z * 0.2, 3);
    if (z > 6 && z < 22) return c.set('#7e7b74').lerp(new Color('#5c5a55'), n); // stony bed
    if (sl > 0.4) return c.set('#7b6a56').lerp(new Color('#655a4b'), n);
    if (Math.abs(x) < 4 && z < 2) return c.set('#7a7064').lerp(new Color('#5f574c'), n * 0.6);
    return c.copy(GRASS).lerp(SCRUB, n).lerp(FOREST, sstep(0.4, 0.8, n) * 0.6);
  }, ground([hole])));
  const water = makeWater(200, 11.5, '#425a62');
  water.mesh.position.set(0, BED + 0.55, 14);
  g.add(water.mesh);
  g.add(makeRocks(90, (i) => { const x = -60 + hash(i, 4) * 120, z = 7.5 + hash(i, 5) * 13; return [x, BED + 0.2, z, 0.25 + hash(i, 6) * 0.6]; }, '#8a867d'));
  // finished abutment on the far bank with wing walls
  const conc = addGrain(new MeshStandardMaterial({ color: '#a5a196', roughness: 0.9 }), { scale: 4, strength: 0.2 });
  const ab = new Mesh(new BoxGeometry(7, 4, 3), conc);
  ab.position.set(0, BED + 2, 22.5);
  ab.castShadow = true; ab.receiveShadow = true;
  g.add(ab);
  for (const s of [-1, 1]) { const w = new Mesh(new BoxGeometry(0.5, 3.4, 5), conc); w.position.set(s * 3.7, BED + 1.9, 24.5); w.rotation.y = s * 0.3; g.add(w); }
  // gabion river training on the near bank
  const gab = makeGabions(8, 7, 5.6, BED + 0.6, 2);
  gab.rotation.y = 0;
  g.add(gab);
  const pit = new Excavation(5.0, 3.0, 2.2, '#6e5643', '#4b3c2e');
  pit.grp.position.set(0, 0, 0.2);
  g.add(pit.grp);
  const spoil = makeHeap('#715846', 6, 0.6);
  g.add(spoil);
  g.add(makeCones([[-3, -1.8], [3, -1.8], [-3.2, 2.4], [3.2, 2.4]]));
  g.add(forestOn(ctx, 700, -100, 100, -70, -8, h, (x, z) => z < -10 && Math.abs(x) > 6, 5));
  g.add(forestOn(ctx, 500, -100, 100, 28, 70, h, (_x, z) => z > 28, 15));

  const B = 4.4, z0 = 0.2 - B;
  const sws = [0.0, -0.28, 0.28, 0.0];
  let measured = false;
  const spoilAt = new Vector3();
  return {
    group: g,
    ambient: true,
    cam: [[0, 74, 12, 36, 0, -0.6, 4], [0.35, 24, 24, 24, 0, -0.4, 0], [0.7, -24, 30, 22, 0, -0.4, 1], [1, -60, 22, 34, 0, -0.8, 8]],
    pose(t) {
      const lift = 0.05;
      const st = sstep(0.05, 0.16, t);
      const d = t < 0.2 ? unfolded(t, 0.12, 0.22, B, lift) : digging(t, 0.22, 0.95, 4, B, 2.2, sws, -1.3, lift);
      return { ...BASE_POSE, x: 0, z: z0, heading: PI / 2, stab: st, ...d };
    },
    update(t, dt, m, dust) {
      const p = this.pose(t) as Pose & { dug?: number; local?: number };
      const dug = p.dug ?? 0;
      pit.set(dug);
      hole.z = dug > 0.004 ? 2.5 : -1; hole.w = dug > 0.004 ? 1.5 : -1;
      water.uTime.value += dt;
      if (!measured) {
        m.apply({ ...p, ...hoeIK(B - 0.1, 1.9, -0.25, 0.05), swing: -1.3 });
        spoilAt.copy(m.hoeTip()).sub(g.position);
        measured = true;
      }
      const f = clamp(dug / 2.2);
      spoil.visible = f > 0.03;
      spoil.position.set(spoilAt.x, 0, spoilAt.z);
      spoil.scale.set(0.7 + f * 1.5, 0.4 + f * 0.9, 0.7 + f * 1.3);
      if (p.local !== undefined && p.local > 0.16 && p.local < 0.44) { const tp = m.hoeTip(); dust.emit(tp.x, 0.1, tp.z, 1, 0.5, 0.5, 1.0); }
    },
  };
}

/* ================================================================== */
/* 4 · Trenching & utilities — pipeline trench on a town road          */
/* ================================================================== */
function setTrench(ctx: Ctx): SetState {
  const g = new Group();
  const TZ = -4.7;
  const hole = new Vector4(-1, TZ, -1, -1);
  const hole2 = new Vector4(-11, TZ, 5, 0.4);
  g.add(heightfield({ w: 200, d: 120, cz: -6, res: ctx.lite ? 2 : 1.2 }, () => 0, (x, z, _y, _s, c) => {
    const n = fbm(x * 0.2, z * 0.2, 3);
    if (x < -16 && Math.abs(z - TZ) < 0.5) return c.set('#8a7a64'); // re-instated strip
    return c.set('#76705f').lerp(new Color('#5d584c'), n * 0.7);
  }, ground([hole, hole2])));
  const road: Vector3[] = [];
  for (let x = -100; x <= 100; x += 5) road.push(new Vector3(x, 0, 0));
  g.add(makeRoad(road, 7.2));
  // the open, laid section behind the machine with pipe already bedded
  const laid = new Excavation(10, 0.8, 1.3, '#6e5643', '#5b4a3a');
  laid.grp.position.set(-11, 0, TZ);
  laid.set(1.3);
  g.add(laid.grp);
  g.add(makePipes([[-13.4, -0.95, TZ, PI / 2], [-11, -0.95, TZ, PI / 2], [-8.6, -0.95, TZ, PI / 2]], 0.3, 2.4));
  // pipes strung out along the far verge ready for laying
  g.add(makePipes(Array.from({ length: 8 }, (_, i) => [-4 + i * 2.6, 0.3, -6.6, PI / 2] as [number, number, number, number]), 0.3, 2.4));
  const trench = new Excavation(6, 0.8, 1.3, '#6e5643', '#4b3c2e');
  trench.grp.position.set(-1, 0, TZ);
  g.add(trench.grp);
  const spoil = makeHeap('#715846', 9, 0.55);
  g.add(spoil);
  for (let i = 0; i < 6; i++) g.add(makeBarricade(-14 + i * 3.2, -3.7, 0, 2.6));
  // street frontage: two- and three-storey shops and houses
  const facade = new MeshStandardMaterial({ roughness: 0.85 });
  const cols = ['#c7bba5', '#b5a58c', '#d0c8b8', '#a79b86', '#bfb3a0'];
  const shutter = new MeshStandardMaterial({ color: '#5d6266', roughness: 0.6, metalness: 0.4 });
  const glass = new MeshStandardMaterial({ color: '#2a363c', roughness: 0.15, metalness: 0.5 });
  const trim = new MeshStandardMaterial({ color: '#e4ddd0', roughness: 0.8 });
  for (const side of [-1]) {
    let x = -60;
    let k = side > 0 ? 3 : 0;
    while (x < 60) {
      const w = 6 + hash(x, side) * 5, fl = 2 + Math.floor(hash(x, side + 3) * 2), H = fl * 3.2;
      const b = new Mesh(new BoxGeometry(w - 0.3, H, 9), facade.clone());
      (b.material as MeshStandardMaterial).color.set(cols[k++ % cols.length]);
      const z = side < 0 ? -12.5 : 11.5;
      b.position.set(x + w / 2, H / 2, z);
      b.castShadow = true; b.receiveShadow = true;
      g.add(b);
      const fz = z - side * 4.52;
      const sh = new Mesh(new BoxGeometry(w * 0.7, 2.4, 0.05), shutter);
      sh.position.set(x + w / 2, 1.3, fz);
      g.add(sh);
      for (let f = 1; f < fl; f++) for (let wi = 0; wi < Math.floor(w / 2.4); wi++) {
        const wx = x + 1.4 + wi * 2.4, wy = f * 3.2 + 1.4;
        const frame = new Mesh(new BoxGeometry(1.2, 1.4, 0.06), trim);
        frame.position.set(wx, wy, fz);
        const win = new Mesh(new BoxGeometry(1.0, 1.2, 0.07), glass);
        win.position.set(wx, wy, fz - side * 0.01);
        const bar = new Mesh(new BoxGeometry(0.04, 1.2, 0.08), trim);
        bar.position.set(wx, wy, fz - side * 0.02);
        const chajja = new Mesh(new BoxGeometry(1.5, 0.08, 0.5), facade);
        chajja.position.set(wx, wy + 0.85, fz - side * 0.25);
        chajja.castShadow = true;
        g.add(frame, win, bar, chajja);
      }
      const slab = new Mesh(new BoxGeometry(w, 0.15, 1.2), facade);
      slab.position.set(x + w / 2, 3.1, fz - side * -0.6);
      g.add(slab);
      x += w;
    }
  }
  // street lights
  for (let i = 0; i < 6; i++) { const pole = new Mesh(new CylinderGeometry(0.07, 0.1, 7, 8), new MeshStandardMaterial({ color: '#5c6166', metalness: 0.6, roughness: 0.4 })); pole.position.set(-40 + i * 16, 3.5, 5.2); pole.castShadow = true; g.add(pole); }

  const B = 3.6, z0 = TZ + B;
  const sws = [0.0, -0.35, 0.35, 0.0];
  let measured = false;
  const spoilAt = new Vector3();
  return {
    group: g,
    cam: [[0, 64, 12, 30, -3, 2.4, -4], [0.35, 88, 18, 22, -2, 1.2, -4], [0.7, 120, 30, 17, -2, 0, -4.4], [1, 40, 22, 30, -5, 1.6, -4]],
    pose(t) {
      const lift = 0.05;
      const st = sstep(0.05, 0.16, t);
      const d = t < 0.2 ? unfolded(t, 0.12, 0.22, B, lift) : digging(t, 0.22, 0.95, 4, B, 1.3, sws, -1.25, lift);
      return { ...BASE_POSE, x: -1, z: z0, heading: -PI / 2, stab: st, ...d };
    },
    update(t, _dt, m, dust) {
      const p = this.pose(t) as Pose & { dug?: number; local?: number };
      const dug = p.dug ?? 0;
      trench.set(dug);
      hole.z = dug > 0.004 ? 3 : -1; hole.w = dug > 0.004 ? 0.4 : -1;
      if (!measured) {
        m.apply({ ...p, ...hoeIK(B - 0.1, 1.9, -0.25, 0.05), swing: -1.25 });
        spoilAt.copy(m.hoeTip()).sub(g.position);
        measured = true;
      }
      const f = clamp(dug / 1.3);
      spoil.visible = f > 0.03;
      spoil.position.set(spoilAt.x, 0, spoilAt.z);
      spoil.scale.set(0.8 + f * 1.3, 0.35 + f * 0.6, 0.6 + f * 0.7);
      if (p.local !== undefined && p.local > 0.16 && p.local < 0.44) { const tp = m.hoeTip(); dust.emit(tp.x, 0.1, tp.z, 1, 0.5, 0.5, 1.0); }
    },
  };
}

/* ================================================================== */
/* 5 · Industrial infrastructure — grading while the shed goes up      */
/* ================================================================== */
function setIndustry(ctx: Ctx, vm: ReturnType<typeof vehicleMats>): SetState {
  const g = new Group();
  g.add(heightfield({ w: 260, d: 180, cz: -10, res: ctx.lite ? 2.5 : 1.5 }, (x, z) => (z < -60 || x > 100 ? fbm(x * 0.02, z * 0.02) * 2 : 0), (x, z, _y, _s, c) => {
    const n = fbm(x * 0.15, z * 0.15, 3);
    if (Math.abs(x + 4) < 32 && z > -24 && z < 18) return c.set('#7f7666').lerp(new Color('#655e52'), n * 0.6);
    return c.copy(GRASS).lerp(new Color('#6b6a47'), n);
  }));
  const shed = buildShed({ bays: 6, bay: 6, span: 18, eave: 7, clad: false });
  shed.root.position.set(-22, 0, -16);
  g.add(shed.root);
  const done = buildShed({ bays: 8, bay: 6, span: 22, eave: 8 });
  done.root.position.set(-40, 0, -58);
  done.built(1);
  g.add(done.root);
  // compacted gravel layer the loader spreads
  const layer = new Mesh(new BoxGeometry(1, 0.16, 2.6), addGrain(new MeshStandardMaterial({ color: '#8d877b', roughness: 1 }), { scale: 9, strength: 0.4 }));
  layer.receiveShadow = true;
  g.add(layer);
  const gravel = makeHeap('#8a8478', 12, 0.5);
  gravel.position.set(-24, 0, 9);
  gravel.scale.set(3.2, 2.0, 2.8);
  g.add(gravel);
  g.add(makeLimeOutline([[-22, -16 - 9.6], [14, -16 - 9.6], [14, -16 + 9.6], [-22, -16 + 9.6]], 0.012, 0.12));
  const tip = buildTipper(vm);
  tip.root.position.set(-30, 0, 4);
  tip.root.rotation.y = 0.4;
  tip.fill(0.2);
  g.add(tip.root);
  g.add(buildContainer());
  g.children[g.children.length - 1].position.set(22, 0, 8);
  const ridges = makeRidges({ seed: 31, layers: [{ z: 0, base: 4, amp: 22, col: '#48555c', freq: 0.01 }, { z: -150, base: 20, amp: 60, col: '#66737c', freq: 0.006 }] });
  ridges.grp.position.set(0, -6, -260);
  g.add(ridges.grp);
  g.add(forestOn(ctx, 300, -120, 120, 26, 80, () => 0, () => true, 21));

  const path = pathTrack([[0, -18, 8.5, 0], [0.12, -18, 8.5, 0], [0.85, 10, 8.5, 0], [1, 12, 8.5, 0]]);
  return {
    group: g,
    cam: [[0, 96, 10, 36, -14, 2.4, 2], [0.4, 72, 14, 32, -4, 2.4, 0], [0.75, 38, 20, 36, 2, 3, -4], [1, 80, 28, 58, -6, 3, -10]],
    pose(t) {
      const m = path(t);
      const [loaderLift, bucketWorld, loaderFill] = track([[0, 0.18, 0.32, 1], [0.12, 0.02, 0.0, 1], [0.85, 0.02, -0.08, 0.15], [1, 0.18, 0.3, 0]], t);
      return { ...BASE_POSE, x: m.x, z: m.z, heading: 0, odo: m.odo, steer: 0, loaderLift, bucketWorld, loaderFill, pitch: clamp(-m.speed * 0.0003, -0.01, 0.01) };
    },
    update(t, _dt, m, dust) {
      shed.built(lerp(0.15, 1, sstep(0.05, 0.95, t)));
      const e = m.loaderEdge();
      const x0 = -16, x1 = Math.max(x0 + 0.1, e.x - g.position.x - 0.4);
      layer.scale.x = x1 - x0;
      layer.position.set((x0 + x1) / 2, 0.08, 8.5);
      layer.visible = t > 0.13;
      if (t > 0.13 && t < 0.85) dust.emit(e.x, 0.2, e.z, 1, 1.4, 0.4, 1.6);
    },
  };
}

/* ================================================================== */
export const create: Factory = async (canvas, ctx) => {
  const { renderer, scene, dispose } = createRenderer(canvas, ctx, { envIntensity: 0.32 });
  renderer.toneMappingExposure = 1.05;
  const camera = new PerspectiveCamera(36, 1, 0.1, 2600);
  let distK = 1;
  const fogCol = new Color('#5e676e');
  scene.background = fogCol;
  scene.fog = new FogExp2(fogCol, 0.0075);
  const sky = makeSky({ top: '#26323c', horizon: '#6c757b', glow: '#d89a64', sunDir: new Vector3(0.7, 0.18, 0.5) });
  scene.add(sky.mesh);
  const L = makeLights(scene, ctx, { sunI: 3.1, hemiI: 0.5, sky: '#b4c3cf', ground: '#3a342c', extent: 16, far: 90 });
  const vm = vehicleMats();
  const builders = [() => setRoad(ctx, vm), () => setHill(ctx), () => setSite(ctx), () => setRiver(ctx), () => setTrench(ctx), () => setIndustry(ctx, vm)];
  const sets: SetState[] = [];
  for (let i = 0; i < builders.length; i++) {
    const s = builders[i]();
    s.group.position.x = i * SPACING;
    s.group.visible = false;
    scene.add(s.group);
    // a distant range behind every hill set
    if (i !== 4 && i !== 5) {
      const r = makeRidges({ seed: i * 7 + 1 });
      r.grp.position.set(i * SPACING, -10, -60);
      r.grp.visible = false;
      s.group.userData.ridges = r.grp;
      scene.add(r.grp);
    }
    sets.push(s);
    await yieldToMain();
  }
  const machine = buildBackhoe(makeMaterials());
  scene.add(machine.root);
  const dust = new Dust(ctx.lite ? 140 : 240);
  scene.add(dust.points);
  try { await renderer.compileAsync(scene, camera); } catch { /* first frame */ }

  const n = sets.length;
  const tmp = new Vector3();
  let current = -1;
  const sunDir = new Vector3(14, 16, 10);

  return {
    resize(w, h) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.clearViewOffset();
      camera.updateProjectionMatrix();
      // tall viewports need the camera further back to hold the same framing
      distK = clamp(1.5 / camera.aspect, 1, 2.1);
    },
    render(p, dt) {
      const f = clamp(p) * n;
      const i = Math.min(n - 1, Math.floor(f));
      const t = p >= 1 ? 1 : f - i;
      const s = sets[i];
      if (i !== current) {
        sets.forEach((x, k) => { x.group.visible = k === i; const r = x.group.userData.ridges as Group | undefined; if (r) r.visible = k === i; });
        current = i;
      }
      const ox = i * SPACING;
      const pose = s.pose(t);
      const world = { ...pose, x: pose.x + ox };
      machine.apply(world);
      s.update(t, dt, machine, dust);
      machine.apply(world); // update() may probe other poses
      dust.step(dt);
      const [az, el, dist, tx, ty, tz] = track(s.cam, t);
      orbit(camera, [az, el, dist * distK, tx + ox, ty, tz], tmp);
      sky.mesh.position.copy(camera.position);
      L.follow(ox + (world.x - ox) * 0.6, 0, (pose.z ?? 0) * 0.6, sunDir);
      // a short cut-to-black between project sets
      const fade = sstep(0, 0.035, t) * (1 - sstep(0.965, 1, t));
      renderer.toneMappingExposure = 1.05 * (i === 0 ? Math.max(fade, sstep(0.9, 1, 1 - t)) : i === n - 1 ? Math.max(fade, sstep(0.9, 1, t)) : fade);
      renderer.render(scene, camera);
      return !!s.ambient || dust.alive > 0;
    },
    dispose,
  };
};
