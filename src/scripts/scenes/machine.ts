/**
 * Backhoe Loader page — the machine proves what it does, on a real hill site.
 *
 *  0  Arrives on its own wheels along the access track
 *  1  Loader end: crowds into a stockpile, reverses, lifts and loads a tipper
 *  2  Repositions with a reversing 90° turn inside the plot
 *  3  Stabilisers down, backhoe unfolds
 *  4  Backhoe end: digs a column-footing pit in three passes (live depth)
 *  5  The loaded tipper leaves; the machine rests over a finished pit
 */
import { Color, FogExp2, PerspectiveCamera, Vector3, Vector4 } from 'three';
import {
  clamp, createRenderer, Dust, Excavation, fbm, ground, hash, heightfield, lerp, makeCones, makeForest, makeHeap, makeLights,
  makeLimeOutline, makeRebarCage, makeRidges, makeRocks, makeSettingOut, makeSky, orbit, pathTrack, seg, sstep, track, yieldToMain,
} from '../three/kit';
import { buildContainer, buildTipper, vehicleMats } from '../three/vehicles';
import { buildBackhoe, hoeIK, makeMaterials, type Pose } from '../backhoe/model';
import type { Factory } from '../stage/runtime';

/* ------------------------------------------------------------------ */
/* Site                                                                */
/* ------------------------------------------------------------------ */
const zBack = (x: number) => lerp(-14, -1.5, sstep(30, 48, x));
const zFront = (x: number) => lerp(16, 10.5, sstep(30, 48, x));
function heightAt(x: number, z: number) {
  const zb = zBack(x), zf = zFront(x);
  const n = fbm(x * 0.06, z * 0.06);
  if (z < zb) {
    const d = zb - z;
    return 4.6 * sstep(0, 2.4, d) + d * 0.45 + (n - 0.5) * Math.min(d, 18) * 0.5;
  }
  if (z > zf) {
    const d = z - zf;
    return -24 * (1 - Math.exp(-d / 20)) + (n - 0.5) * Math.min(d, 10) * 0.35 - sstep(0, 1.2, d) * 0.3;
  }
  return 0;
}
const C = {
  pad: new Color('#80776a'), padDark: new Color('#625a4e'), cutA: new Color('#946f4e'), cutB: new Color('#6a5340'), rock: new Color('#7f7b73'),
  forest: new Color('#2a3528'), forest2: new Color('#37422f'), scrub: new Color('#565a42'), grass: new Color('#4a5737'),
};
function colorAt(x: number, z: number, h: number, slope: number, c: Color) {
  const zb = zBack(x), zf = zFront(x);
  const n = fbm(x * 0.2, z * 0.2, 3);
  if (z >= zb - 0.2 && z <= zf + 0.3) {
    c.copy(C.pad).lerp(C.padDark, n * 0.7);
    // compaction tracks along the access route
    if (x > 20 && Math.abs(z - lerp(4, 6, sstep(30, 48, x))) < 2.6) c.multiplyScalar(0.92);
    return;
  }
  if (z < zb) {
    const d = zb - z;
    if (d < 3.2 && slope > 0.35) {
      const band = (Math.sin(h * 5.2 + n * 2.6) + 1) / 2;
      c.copy(C.cutA).lerp(C.cutB, band).lerp(C.rock, n > 0.6 ? 0.55 : 0);
      return;
    }
    c.copy(C.forest).lerp(C.forest2, n).lerp(C.scrub, sstep(0.6, 0.9, slope) * 0.4);
    return;
  }
  c.copy(C.grass).lerp(C.scrub, n).lerp(C.forest, sstep(4, 18, z - zf) * 0.6);
}

/* ------------------------------------------------------------------ */
/* Choreography                                                        */
/* ------------------------------------------------------------------ */
const PI = Math.PI;
const TIPPER = { x: 0, z: -9.6 };
const PILE = { x: 13.6, z: -9.2 };
const DIG = { x: -8.8, z: 2.2 };
const B = 4.7; // pit centre, metres behind the machine origin
const path = pathTrack([
  [0.0, 52, 6.2, PI],
  [0.1, 24, 3.4, PI * 0.97],
  [0.165, PILE.x, -2.4, PI / 2],
  [0.185, PILE.x, -2.4, PI / 2],
  [0.205, PILE.x, -4.6, PI / 2], // crowd into the pile
  [0.215, PILE.x, -4.6, PI / 2],
  [0.24, PILE.x - 0.4, -0.8, PI * 0.56], // reverse out
  [0.262, 7.5, -1.2, PI * 0.62],
  [0.282, TIPPER.x - 0.6, -5.2, PI / 2], // up to the tipper
  [0.305, TIPPER.x - 0.6, -5.2, PI / 2],
  [0.33, TIPPER.x - 0.6, -1.6, PI / 2], // back off
  [0.36, TIPPER.x - 0.6, -1.6, PI / 2],
  [0.405, -2.0, 1.4, PI / 4], // reversing 90° turn
  [0.445, -5.2, 2.3, 0],
  [0.49, DIG.x, DIG.z, 0],
  [1, DIG.x, DIG.z, 0],
]);

/** Three passes into a 2.4 m column-footing pit, each 0.6 m deeper. */
const DEPTH = 1.8;
function digCycle(t: number, k: number) {
  const d0 = (k * DEPTH) / 3, d1 = ((k + 1) * DEPTH) / 3;
  const keys = [
    [0.0, B + 1.0, 1.0, -1.2, 0, 0],
    [0.16, B + 1.05, -d0 + 0.05, -1.35, 0, 0],
    [0.44, B - 0.85, -d1, -2.45, 0, 0.6],
    [0.56, B - 0.7, 0.9, -3.05, 0, 1],
    [0.7, B - 0.1, 1.9, -3.05, 0.95, 1],
    [0.83, B - 0.1, 1.9, -0.25, 0.95, 0],
    [1.0, B + 1.0, 1.0, -1.2, 0, 0],
  ];
  const [back, h, phi, swing, fill] = track(keys, t);
  const depth = lerp(d0, d1, sstep(0.16, 0.44, t));
  return { back, h, phi, swing, fill, depth };
}

function poseAt(p: number): Pose & { depth: number; pile: number; tipFill: number; dumping: number } {
  const m = path(p);
  // loader: carry → lower & crowd → curl → lift to tipper → dump → carry
  const [loaderLift, bucketWorld, loaderFill] = track([
    [0, 0.18, 0.3, 0],
    [0.17, 0.18, 0.3, 0],
    [0.185, 0.0, -0.05, 0],
    [0.205, 0.0, -0.02, 0.35],
    [0.215, 0.05, 0.42, 1],
    [0.24, 0.22, 0.42, 1],
    [0.282, 1.0, 0.36, 1],
    [0.29, 1.0, 0.36, 1],
    [0.302, 1.0, -0.85, 0],
    [0.33, 0.6, 0.2, 0],
    [0.36, 0.18, 0.3, 0],
    [1, 0.18, 0.3, 0],
  ], p);
  const stab = sstep(0.5, 0.55, p);
  const lift = Math.max(0, stab - 0.82) / 0.18 * 0.05;
  // backhoe: travel fold → unfold → dig ×3 → fold to a ready pose
  let boom = 1.18, dipper = -2.72, hoeBucket = -1.7, swing = 0, hoeFill = 0, depth = 0;
  const unfold = sstep(0.55, 0.64, p);
  const ready = hoeIK(B + 1.0, 1.0, -1.2, lift);
  if (p >= 0.55) {
    boom = lerp(1.18, ready.boom, unfold); dipper = lerp(-2.72, ready.dipper, unfold); hoeBucket = lerp(-1.7, ready.hoeBucket, unfold);
  }
  const digT = seg(p, 0.667, 0.83) * 3;
  if (p >= 0.667) {
    const k = Math.min(2, Math.floor(digT));
    const c = digCycle(p >= 0.83 ? 1 : digT - k, p >= 0.83 ? 2 : k);
    const ik = hoeIK(c.back, c.h, c.phi, lift);
    ({ boom, dipper, hoeBucket } = ik);
    swing = c.swing; hoeFill = c.fill; depth = c.depth;
  }
  // final: tuck to a tidy ready pose
  const rest = sstep(0.86, 0.94, p);
  if (rest > 0) {
    const r = hoeIK(B - 0.6, 1.6, -2.6, lift);
    boom = lerp(boom, r.boom, rest); dipper = lerp(dipper, r.dipper, rest); hoeBucket = lerp(hoeBucket, r.hoeBucket, rest); swing = lerp(swing, 0.2, rest);
  }
  const pile = 1 - sstep(0.19, 0.212, p) * 0.22;
  const tipFill = 0.45 + sstep(0.29, 0.305, p) * 0.4;
  return {
    x: m.x, z: m.z, heading: m.heading, odo: m.odo, steer: m.steer,
    loaderLift, bucketWorld, loaderFill, boom, dipper, hoeBucket, swing, stab, hoeFill,
    pitch: clamp(-m.speed * 0.0004, -0.012, 0.012),
    depth: p >= 0.83 ? DEPTH : depth, pile, tipFill, dumping: seg(p, 0.29, 0.305),
  };
}

/* camera: [p, az, el, dist, dx, dy, dz, follow] — target = follow·machine + (dx,dy,dz) */
const camKeys = [
  [0.0, -58, 9, 21, -1, 2.6, 0, 1],
  [0.1, -80, 12, 17, 0, 2.0, 0, 1],
  [0.165, -12, 16, 13, 0, 1.4, -2.4, 1],
  [0.215, 8, 13, 12, 0, 1.4, -2.6, 1],
  [0.26, -40, 24, 16, 0, 1.8, -2.4, 1],
  [0.3, -62, 28, 15, 0, 2.0, -2.4, 1],
  [0.34, -70, 40, 17, 0, 1.2, 0, 1],
  [0.38, 70, 62, 24, -1, 0.5, 0, 1],
  [0.48, 96, 64, 23, -1, 0.5, 0, 1],
  [0.53, 150, 13, 12.5, -1.6, 1.3, 0, 1],
  [0.64, 128, 16, 12, -3.0, 1.1, 0, 1],
  [0.7, 112, 30, 11, -4.6, -0.2, 0, 1],
  [0.82, 132, 34, 10.5, -4.6, -0.3, 0, 1],
  [0.9, 120, 30, 20, -2.5, 0.3, -1, 1],
  [1.0, -72, 17, 36, 4, 4, 4, 1],
];

/* ------------------------------------------------------------------ */
export const create: Factory = async (canvas, ctx) => {
  const { renderer, scene, dispose } = createRenderer(canvas, ctx, { envIntensity: 0.32 });
  renderer.toneMappingExposure = 1.05;
  const camera = new PerspectiveCamera(ctx.mobile ? 46 : 34, 1, 0.1, 2500);
  const fogCol = new Color('#59636b');
  scene.background = fogCol;
  scene.fog = new FogExp2(fogCol, 0.0085);
  const sunDir = new Vector3(14, 16, 10);
  const L = makeLights(scene, ctx, { sunI: 3.1, hemiI: 0.5, sky: '#b4c3cf', ground: '#3a342c', extent: 14 });
  const sky = makeSky({ top: '#26323c', horizon: '#6c757b', glow: '#d89a64', sunDir: new Vector3(0.7, 0.18, 0.5) });
  scene.add(sky.mesh);
  const ridges = makeRidges({ seed: 3 });
  ridges.grp.position.z = -40;
  scene.add(ridges.grp);
  const rr = makeRidges({ seed: 9, layers: [
    { z: 0, base: 4, amp: 30, col: '#36423f', freq: 0.012 },
    { z: -90, base: 10, amp: 50, col: '#4a565d', freq: 0.008 },
  ] });
  rr.grp.rotation.y = PI;
  rr.grp.position.set(0, -26, 150);
  scene.add(rr.grp);
  await yieldToMain();

  // ground with the pit opening cut out
  const pit = new Excavation(2.4, 2.4, DEPTH, '#6f5643', '#4b3b2d');
  const pitX = DIG.x - B, pitZ = DIG.z;
  pit.grp.position.set(pitX, 0, pitZ);
  scene.add(pit.grp);
  const hole = new Vector4(pitX, pitZ, -1, -1);
  const terrain = heightfield({ w: 260, d: 200, cx: 20, cz: -10, res: ctx.lite ? 1.4 : 0.8 }, heightAt, colorAt, ground([hole]));
  scene.add(terrain);
  await yieldToMain();

  // vegetation on the slopes above and below the plot
  scene.add(makeForest(ctx.lite ? 700 : 1600, (i) => {
    const x = -90 + hash(i, 1) * 230, side = hash(i, 2) < 0.62 ? -1 : 1;
    const z = side < 0 ? zBack(x) - 4 - hash(i, 3) * 70 : zFront(x) + 7 + hash(i, 4) * 60;
    if (fbm(x * 0.04, z * 0.04) < 0.42) return null;
    return [x, heightAt(x, z), z, 1.5 + hash(i, 5) * 1.6];
  }, { broad: 0.22 }));
  // fallen debris at the foot of the cut face
  scene.add(makeRocks(36, (i) => {
    const x = -34 + hash(i, 8) * 70, z = zBack(x) + 0.2 + hash(i, 9) * 1.4;
    if (Math.abs(x - PILE.x) < 5 || Math.abs(x - TIPPER.x) < 6) return null;
    return [x, 0.05, z, 0.12 + hash(i, 10) * 0.32];
  }));
  await yieldToMain();

  // site furniture
  const vm = vehicleMats();
  const tipper = buildTipper(vm);
  tipper.root.position.set(TIPPER.x, 0, TIPPER.z);
  scene.add(tipper.root);
  const pile = makeHeap('#6d5441', 2, 0.55);
  pile.position.set(PILE.x, 0, PILE.z);
  scene.add(pile);
  const spoil = makeHeap('#715846', 5, 0.6);
  scene.add(spoil);
  const office = buildContainer();
  office.position.set(-24, 0, -10.5);
  office.rotation.y = 0.08;
  scene.add(office);
  scene.add(makeSettingOut([[pitX - 1.6, pitZ - 1.6], [pitX + 1.6, pitZ - 1.6], [pitX + 1.6, pitZ + 1.6], [pitX - 1.6, pitZ + 1.6]]));
  // the rest of the footing grid, marked in lime, two cages ready
  for (const [dx, dz] of [[0, 6], [-5.5, 0], [-5.5, 6]]) scene.add(makeLimeOutline([[pitX + dx - 1.2, pitZ + dz - 1.2], [pitX + dx + 1.2, pitZ + dz - 1.2], [pitX + dx + 1.2, pitZ + dz + 1.2], [pitX + dx - 1.2, pitZ + dz + 1.2]]));
  for (const [x, z] of [[-20.5, -6.5], [-19, -6.6]]) { const cg = makeRebarCage(); cg.position.set(x, 0, z); cg.rotation.z = PI / 2; cg.position.y = 0.16; scene.add(cg); }
  scene.add(makeCones([[pitX + 2.4, pitZ - 2.3], [pitX + 2.4, pitZ + 2.4], [pitX - 2.3, pitZ + 2.4], [26, 0.6], [26, 9.2]]));

  const machine = buildBackhoe(makeMaterials());
  scene.add(machine.root);
  const dust = new Dust(ctx.lite ? 140 : 260);
  scene.add(dust.points);
  await yieldToMain();

  // place the spoil heap where the bucket actually dumps
  const dumpPose = poseAt(0.667 + (0.83 - 0.667) * (0.8 / 3));
  machine.apply(dumpPose);
  const dumpAt = machine.hoeTip();
  spoil.position.set(dumpAt.x - 0.4, 0, dumpAt.z + 0.3);

  try { await renderer.compileAsync(scene, camera); } catch { /* compile on first frame */ }

  const tmp = new Vector3(), tip = new Vector3(), edge = new Vector3();
  let lastP = -1, lastDepth = 0, lastPile = 1, lastDump = 0;
  let pose = poseAt(0);

  return {
    resize(w, h) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      if (ctx.capture) camera.clearViewOffset();
      else if (ctx.mobile) camera.setViewOffset(w, h, 0, h * 0.22, w, h);
      else camera.setViewOffset(w, h, -w * 0.16, h * 0.02, w, h);
      camera.updateProjectionMatrix();
    },
    render(p, dt) {
      pose = poseAt(p);
      machine.apply(pose);
      pit.set(pose.depth);
      // the ground opens only once the bucket has broken it
      const open = pose.depth > 0.004;
      hole.z = hole.w = open ? 1.2 : -1;
      // stockpile shrinks, tipper fills, spoil grows with each pass
      pile.scale.set(3.4 * pose.pile, 2.2 * pose.pile, 3.0 * pose.pile);
      tipper.fill(pose.tipFill);
      const passes = clamp((pose.depth - 0.05) / DEPTH);
      spoil.visible = passes > 0.05;
      spoil.scale.set(0.6 + passes * 1.1, 0.5 + passes * 0.75, 0.6 + passes * 1.0);
      // the loaded tipper pulls away at the end
      const leave = sstep(0.86, 1, p);
      tipper.root.position.x = TIPPER.x + leave * leave * 46;
      tipper.roll(leave * leave * 46);

      // dust: when the bucket bites, dumps, or the machine moves on gravel
      if (dt > 0 && Math.abs(p - lastP) > 1e-5) {
        machine.hoeTip(tip);
        if (pose.depth > lastDepth + 1e-4) dust.emit(tip.x, Math.max(-pose.depth, tip.y), tip.z, 2, 0.5, 0.5, 1.0);
        if (pose.pile < lastPile - 1e-4) { machine.loaderEdge(edge); dust.emit(edge.x, 0.3, edge.z, 2, 0.8, 0.4, 1.4); }
        if (pose.dumping > lastDump && pose.dumping < 0.99) { machine.loaderEdge(edge); dust.emit(edge.x, 2.2, edge.z, 3, 1.0, -0.2, 1.6); }
        if ((pose.hoeFill ?? 0) < 0.5 && pose.swing > 0.6 && p > 0.667 && p < 0.83) dust.emit(tip.x, tip.y - 0.4, tip.z, 1, 0.5, 0.2, 1.4);
        if (leave > 0 && leave < 0.95) dust.emit(tipper.root.position.x - 3.6, 0.3, TIPPER.z, 2, 1.2, 0.5, 2.2);
      }
      lastP = p; lastDepth = pose.depth; lastPile = pose.pile; lastDump = pose.dumping;
      dust.step(dt);

      const [az, el, dist, dx, dy, dz, fo] = track(camKeys, p);
      const tx = pose.x! * fo + dx, tz = pose.z! * fo + dz;
      orbit(camera, [az, el, ctx.mobile ? dist * 1.35 : dist, tx, dy, tz], tmp);
      L.follow(pose.x!, 0, pose.z!, sunDir);
      renderer.render(scene, camera);
      return dust.alive > 0;
    },
    hud(p) {
      const pp = poseAt(p);
      machine.hoeTip(tip);
      machine.loaderEdge(edge);
      return {
        travel: `${Math.abs(pp.odo ?? 0).toFixed(1)} m`,
        loader: `${Math.max(0, edge.y).toFixed(2)} m`,
        depth: pp.depth > 0.004 ? `${pp.depth.toFixed(2)} m` : '—',
        stab: pp.stab < 0.02 ? 'Stowed' : pp.stab > 0.98 ? 'Deployed' : 'Lowering',
      };
    },
    dispose,
  };
};
