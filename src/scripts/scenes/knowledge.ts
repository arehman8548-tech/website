/**
 * Knowledge — a small, calm viewer beside the answers. As the reader moves
 * between topic groups it shows the situation those answers are about:
 *
 *  hiring      the machine on a hill-road shoulder, ready for a task
 *  terrain     stabilisers down, arm at full depth, with the depth line
 *  deployment  loaded on a low-bed for a longer move into the hills
 *  support     working: a drain being cut, as the terms cover
 *  company     at the base: workshop and gate at Haldwani
 *
 * Desktop only; it renders only on scroll (no idle animation).
 */
import { BoxGeometry, Color, FogExp2, Mesh, MeshBasicMaterial, PerspectiveCamera, Vector3, Vector4 } from 'three';
import { createRenderer, Excavation, fbm, ground, hash, heightfield, lerp, makeCones, makeForest, makeLights, makeRidges, makeRoad, makeSky, orbit, sstep, track, yieldToMain } from '../three/kit';
import { buildLowbed, buildShed, vehicleMats } from '../three/vehicles';
import { buildBackhoe, hoeIK, makeMaterials, type Pose } from '../backhoe/model';
import type { Factory } from '../stage/runtime';

const PI = Math.PI;
const BASE: Pose = { x: 0, loaderLift: 0.18, bucketWorld: 0.3, boom: 1.18, dipper: -2.72, hoeBucket: -1.7, swing: 0, stab: 0, pitch: 0 };
const VIEWS = [
  { x: 0, cap: 'Hire for a task, a month or the project phase' },
  { x: 40, cap: 'Max dig depth ≈ 4.5–6 m (7–8 t class)' },
  { x: 90, cap: 'Own wheels nearby; low-bed for longer moves' },
  { x: 140, cap: 'Operator and breakdown terms set out in the quote' },
  { x: 190, cap: 'Machines deployed from Haldwani' },
];

export const create: Factory = async (canvas, ctx) => {
  const { renderer, scene, dispose } = createRenderer(canvas, { ...ctx, mobile: true }, { envIntensity: 0.3 });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  const camera = new PerspectiveCamera(30, 1, 0.1, 2000);
  const fog = new Color('#5b646b');
  scene.background = fog;
  scene.fog = new FogExp2(fog, 0.008);
  scene.add(makeSky({ top: '#26323c', horizon: '#6c757b', glow: '#d89a64' }).mesh);
  const L = makeLights(scene, { ...ctx, mobile: true }, { sunI: 3, hemiI: 0.5, extent: 12 });
  const r = makeRidges({ seed: 77 });
  r.grp.position.set(90, -4, -40);
  scene.add(r.grp);
  const h = (x: number, z: number) => {
    const n = fbm(x * 0.06, z * 0.06);
    const yard = sstep(160, 170, x);
    if (yard > 0 && z < -4.6 && z > -34) return (1 - yard) * (5 * Math.min(1, (-4.6 - z) / 1.6) + (-4.6 - z) * 0.5);
    if (z < -4.6) { const d = -4.6 - z; return 5 * Math.min(1, d / 1.6) + d * 0.5 + (n - 0.5) * Math.min(d, 12) * 0.6; }
    if (z > 4.2) { const d = z - 4.2; return -18 * (1 - Math.exp(-d / 14)); }
    return 0;
  };
  const pitHole = new Vector4(40 - 4.9, 0, 1.1, 1.1), drainHole = new Vector4(140, -4.0, -1, -1);
  scene.add(heightfield({ w: 320, d: 120, cx: 95, cz: -10, res: 1.6 }, h, (x, z, y, sl, c) => {
    const n = fbm(x * 0.2, z * 0.2, 3);
    if (z < -4.6) return sl > 0.4 && z > -8 ? c.set('#8a6a4c').lerp(new Color('#665241'), (Math.sin(y * 5) + 1) / 2) : c.set('#2c3729').lerp(new Color('#3a442f'), n);
    if (z > 4.2) return c.set('#4a5737').lerp(new Color('#585b42'), n);
    return c.set('#6f6658').lerp(new Color('#58514a'), n * 0.6);
  }, ground([pitHole, drainHole])));
  const road: Vector3[] = [];
  for (let x = -60; x <= 260; x += 5) road.push(new Vector3(x, 0, -0.2));
  scene.add(makeRoad(road, 6.2));
  scene.add(makeForest(500, (i) => {
    const x = -60 + hash(i, 1) * 320, side = hash(i, 2) < 0.6 ? -1 : 1;
    const z = side < 0 ? -9 - hash(i, 3) * 50 : 9 + hash(i, 4) * 40;
    return fbm(x * 0.04, z * 0.04) < 0.42 ? null : [x, h(x, z), z, 1.5 + hash(i, 5) * 1.6];
  }));
  await yieldToMain();
  // terrain view: a deep pit with the depth line
  const pit = new Excavation(2.2, 2.2, 4.8, '#6e5643', '#4b3c2e');
  pit.grp.position.set(40 - 4.9, 0, 0);
  pit.set(4.6);
  scene.add(pit.grp);
  const depthLine = new Mesh(new BoxGeometry(0.05, 4.6, 0.05), new MeshBasicMaterial({ color: '#e08a4f' }));
  depthLine.position.set(40 - 4.9 + 1.12, -2.3, 1.12);
  scene.add(depthLine);
  for (const y of [0, -4.6]) { const t = new Mesh(new BoxGeometry(0.5, 0.04, 0.04), depthLine.material); t.position.set(40 - 4.9 + 1.12, y, 1.12); scene.add(t); }
  // deployment view: the low-bed
  const vm = vehicleMats();
  const lowbed = buildLowbed(vm);
  lowbed.root.position.set(94, 0, 0.4);
  scene.add(lowbed.root);
  // support view: a drain being cut
  const drain = new Excavation(5, 0.8, 0.8, '#6e5643', '#4b3c2e');
  drain.grp.position.set(140, 0, -4.0);
  scene.add(drain.grp);
  scene.add(makeCones([[136, -2.6], [144, -2.6], [133, -1.6]]));
  // company view: workshop at the base
  const shed = buildShed({ bays: 3, bay: 6, span: 14, eave: 6 });
  shed.root.position.set(178, 0, -16);
  shed.built(1);
  scene.add(shed.root);

  const machine = buildBackhoe(makeMaterials());
  scene.add(machine.root);
  try { await renderer.compileAsync(scene, camera); } catch { /* first frame */ }

  const n = VIEWS.length;
  const tmp = new Vector3();
  const poseFor = (i: number, t: number): Pose => {
    const x = VIEWS[i].x;
    switch (i) {
      case 1: { const ik = hoeIK(4.9, -4.5, -2.0, 0.05); return { ...BASE, x, z: 0, stab: 1, ...ik }; }
      case 2: return { ...BASE, x: 94 + lowbed.deckX + 1.4, y: lowbed.deckY, z: 0.4 };
      case 3: {
        const lt = (t * 2) % 1;
        const [back, hh, phi, sw] = track([[0, 4.9, 1, -1.2, 0], [0.3, 4.9, -0.5, -1.4, 0], [0.6, 3.6, -0.7, -2.6, 0], [0.8, 3.8, 1.2, -3.0, 0.9], [1, 4.9, 1, -1.2, 0]], lt);
        return { ...BASE, x, z: 0.6, heading: -PI / 2, stab: 1, swing: sw, ...hoeIK(back, hh, phi, 0.05) };
      }
      case 4: return { ...BASE, x: x - 6, z: -2, heading: 0.15 };
      default: return { ...BASE, x, z: 1.2, heading: 0.05, loaderLift: 0.02, bucketWorld: 0 };
    }
  };
  const cams = [
    [52, 10, 15, 0, 1.4, 0],
    [150, 30, 11, 40 - 4.6, -1.4, 0.4],
    [60, 14, 30, 90, 2, 0],
    [70, 20, 14, 140, 0.6, -2.4],
    [62, 14, 34, 186, 3, -10],
  ];

  return {
    resize(w, hh) {
      renderer.setSize(w, hh, false);
      camera.aspect = w / hh;
      camera.updateProjectionMatrix();
    },
    render(p) {
      const f = Math.min(n - 0.0001, p * n);
      const i = Math.floor(f), t = f - i;
      machine.apply(poseFor(i, t));
      drain.set(i === 3 ? 0.4 + t * 0.4 : 0.7);
      drainHole.z = 2.5; drainHole.w = 0.4;
      const k = cams[i].map((v, j) => (j === 0 ? v + lerp(-8, 8, t) : v));
      orbit(camera, k as number[], tmp);
      L.follow(VIEWS[i].x, 0, 0);
      renderer.toneMappingExposure = 1.05 * sstep(0, 0.05, t) * (1 - sstep(0.95, 1, t) * (i < n - 1 ? 1 : 0)) + (i === 0 && t < 0.05 ? 1.05 * (1 - sstep(0, 0.05, t)) : 0);
      renderer.render(scene, camera);
    },
    hud(p) {
      return { cap: VIEWS[Math.min(n - 1, Math.floor(p * n))].cap };
    },
    dispose,
  };
};
