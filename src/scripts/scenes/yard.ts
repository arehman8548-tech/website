/**
 * Why RBE — the organisation behind the machine, at the Haldwani base.
 *
 *  0 Requirement     dawn over the yard; a site beacon on the hills to the north
 *  1 Planning        the machine for the job, under the floodlights
 *  2 Mobilisation    ramps down, machine drives onto the low-bed, ramps up
 *  3 Deployment      the low-bed leaves through the gate and takes the road for the hills
 *  4 Project support the camera rises: the road climbing ahead to the site, terms settled
 *
 * The dispatch road is one 3D centreline (plan + grade). The terrain is cut and
 * filled to its bench, the truck keeps to the left lane, and the articulated rig
 * is placed from its axle contact points on that lane, so wheels, chassis and
 * load follow the road's curvature and climb.
 *
 * Only what RBE states on the site is shown: no inspection routine, fleet size
 * or service-vehicle commitments are implied.
 */
import { AdditiveBlending, BoxGeometry, CatmullRomCurve3, Color, CylinderGeometry, FogExp2, Group, InstancedBufferAttribute, InstancedMesh, Mesh, MeshStandardMaterial, Object3D, PerspectiveCamera, ShaderMaterial, SphereGeometry, SpotLight, Vector3 } from 'three';
import {
  addGrain, clamp, createRenderer, Dust, fbm, hash, heightfield, lerp, makeCones, makeForest, makeLights, makeRidges, makeRoad, makeRocks, makeSky, orbit, pathTrack, seg, sstep, track, yieldToMain,
} from '../three/kit';
import { buildContainer, buildLowbed, buildPickup, buildShed, vehicleMats } from '../three/vehicles';
import { buildBackhoe, hoeIK, makeMaterials, type Pose } from '../backhoe/model';
import type { Factory } from '../stage/runtime';

const PI = Math.PI;
const TRUCK0 = 8, LANE = 10; // low-bed parked at x = 8, z = 10, facing the gate (+x)
const BASE: Pose = { x: 0, loaderLift: 0.18, bucketWorld: 0.3, boom: 1.18, dipper: -2.72, hoeBucket: -1.7, swing: 0, stab: 0, pitch: 0 };

/* ---------------- dispatch road ---------------- */
const ROAD_W = 7.5; // two-lane carriageway
const KEEP_LEFT = 1.6; // lane centre, left of the road centreline (India drives on the left)
const ROAD_START = 31; // surfaced from the yard gate (x = 32) outwards
const SURF = 0.02; // makeRoad lifts its surface this much above the centreline
// Centreline [x, z, y]: out of the gate along the Haldwani plain, north into the foothills,
// then a 6–7 % traverse and a hairpin up to the site bench. Starts inside the yard so the
// parked low-bed is already on it (z = LANE + KEEP_LEFT puts the left lane on z = LANE).
const ctrl: [number, number, number][] = [
  [-24, 11.6, 0], [0, 11.6, 0], [32, 11.6, 0], [60, 11.6, 0], [90, 10.6, 0.1], [118, 5.2, 0.3], [140, -6, 0.6], [156, -22, 1.2],
  [166, -42, 2.4], [172, -64, 4.0], [186, -86, 5.6], [210, -100, 7.2], [240, -108, 9.0], [266, -117, 10.8], [282, -132, 12.2],
  [276, -150, 13.6], [250, -158, 15.4], [220, -170, 17.4], [200, -190, 19.4], [188, -215, 21.4], [186, -245, 23.4], [190, -270, 24.8], [192, -288, 25.4],
];
const centre = new CatmullRomCurve3(ctrl.map(([x, z, y]) => new Vector3(x, y, z)), false, 'centripetal');
centre.arcLengthDivisions = 4000;
const DENSE = centre.getSpacedPoints(Math.round(centre.getLength() / 1.5));
const SITE = DENSE[DENSE.length - 1].clone(); // the site bench at the head of the road

/** Polyline with arc-length lookup; extrapolates straight off either end. */
function polyline(pts: Vector3[]) {
  const acc = new Float64Array(pts.length);
  for (let i = 1; i < pts.length; i++) acc[i] = acc[i - 1] + pts[i].distanceTo(pts[i - 1]);
  const length = acc[pts.length - 1];
  return {
    length,
    at(s: number, out = new Vector3()) {
      let i = 0;
      if (s >= length) i = pts.length - 2;
      else if (s > 0) { let lo = 0, hi = pts.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (acc[m] <= s) lo = m; else hi = m; } i = lo; }
      const t = (s - acc[i]) / (acc[i + 1] - acc[i]);
      return out.lerpVectors(pts[i], pts[i + 1], t);
    },
  };
}
// left-lane track: the centreline offset to the left of the direction of travel
const LANE_PTS = DENSE.map((p, i) => {
  const a = DENSE[Math.max(0, i - 1)], b = DENSE[Math.min(DENSE.length - 1, i + 1)];
  const dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz) || 1;
  return new Vector3(p.x + (dz / L) * KEEP_LEFT, p.y, p.z - (dx / L) * KEEP_LEFT);
});
const lane = polyline(LANE_PTS);

/** Nearest point on the centreline: plan distance, interpolated road level and arc index. */
function nearRoad(x: number, z: number) {
  let bi = 0, bd = Infinity;
  for (let i = 0; i < DENSE.length; i += 4) { const p = DENSE[i], d = (p.x - x) ** 2 + (p.z - z) ** 2; if (d < bd) { bd = d; bi = i; } }
  for (let i = Math.max(0, bi - 4); i <= Math.min(DENSE.length - 1, bi + 4); i++) { const p = DENSE[i], d = (p.x - x) ** 2 + (p.z - z) ** 2; if (d < bd) { bd = d; bi = i; } }
  let best = { d: Math.sqrt(bd), y: DENSE[bi].y, i: bi };
  for (const j of [bi - 1, bi]) {
    if (j < 0 || j >= DENSE.length - 1) continue;
    const a = DENSE[j], b = DENSE[j + 1], ex = b.x - a.x, ez = b.z - a.z;
    const t = clamp(((x - a.x) * ex + (z - a.z) * ez) / (ex * ex + ez * ez));
    const d = Math.hypot(a.x + ex * t - x, a.z + ez * t - z);
    if (d <= best.d) best = { d, y: lerp(a.y, b.y, t), i: j + t };
  }
  return best;
}

/** Undisturbed ground: the bhabar plain at Haldwani, with the foothills rising to the north-east where the road climbs. */
function natural(x: number, z: number) {
  const k = -z - 30, hills = sstep(40, 150, x);
  let h = (fbm(x * 0.02, z * 0.02) - 0.5) * 1.2;
  h += hills * 0.11 * (k + Math.sqrt(k * k + 64)) / 2; // foothill grade, eased in
  h += hills * (fbm(x * 0.012 + 7, z * 0.012) - 0.5) * 10 * sstep(-40, -140, z); // spurs and re-entrants
  h += Math.max(0, x - 300) * 0.1;
  return h;
}

/** Finished ground: natural terrain cut / filled to the road bench, the yard and the site levelled. */
export function heightAt(x: number, z: number) {
  let h = natural(x, z);
  const r = nearRoad(x, z);
  const bench = r.y - 0.03, dh = h - bench;
  const half = ROAD_W / 2 + 1.6; // carriageway + shoulder and side drain
  // steep rock / earth cut on the hill side, flatter fill slope on the valley side
  h = lerp(bench, h, sstep(half, half + (dh > 0 ? 1 + dh * 0.75 : 1 - dh * 1.7), r.d));
  const sd = Math.hypot(x - SITE.x, z - SITE.z);
  h = lerp(SITE.y - 0.03, h, sstep(16, 28, sd));
  const yd = Math.hypot(Math.max(0, Math.abs(x) - 34), Math.max(0, Math.abs(z) - 24));
  return lerp(0, h, sstep(0, 8, yd));
}

type Lowbed = ReturnType<typeof buildLowbed>;
const tmpA = new Vector3(), tmpB = new Vector3();
/** Road-surface height under a lane point (the yard is bare ground, the road is surfaced). */
const onSurface = (v: Vector3) => { v.y += SURF * sstep(ROAD_START - 1, ROAD_START + 1, v.x); return v; };
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

/**
 * Place the articulated rig with its drive bogie at arc length s on the left lane:
 * the tractor rests on its drive bogie and steer axle, the trailer hangs on the kingpin
 * and rests its bogie on the lane at the trailer's true length.
 */
export function placeRig(lb: Lowbed, s: number) {
  const wb = lb.steerX - lb.driveX;
  const R = onSurface(lane.at(s, new Vector3())), F = onSurface(lane.at(s + wb, new Vector3()));
  const h = Math.atan2(-(F.z - R.z), F.x - R.x), pitch = Math.atan2(F.y - R.y, Math.hypot(F.x - R.x, F.z - R.z));
  lb.tractor.rotation.set(0, h, pitch, 'YXZ');
  const dir = new Vector3(Math.cos(h) * Math.cos(pitch), Math.sin(pitch), -Math.sin(h) * Math.cos(pitch));
  lb.tractor.position.copy(R).addScaledVector(dir, -lb.driveX);
  lb.tractor.updateMatrix();
  const K = lb.kingpin.clone().applyMatrix4(lb.tractor.matrix);
  // front wheels point along the lane where they are
  lane.at(s + wb + 0.5, tmpA); lane.at(s + wb - 0.5, tmpB);
  lb.steer(wrap(Math.atan2(-(tmpA.z - tmpB.z), tmpA.x - tmpB.x) - h));
  // trailer bogie: on the lane, one trailer length (kingpin → bogie contact) behind the kingpin
  const lx = lb.kingpin.x - lb.bogieX, ly = lb.kingpin.y, Lt = Math.hypot(lx, ly);
  let st = s + (lb.kingpin.x - lb.driveX) - lx;
  const T = new Vector3();
  for (let k = 0; k < 6; k++) { onSurface(lane.at(st, T)); st += K.distanceTo(T) - Lt; }
  onSurface(lane.at(st, T));
  const th = Math.atan2(-(K.z - T.z), K.x - T.x);
  const tp = Math.atan2(K.y - T.y, Math.hypot(K.x - T.x, K.z - T.z)) - Math.atan2(ly, lx);
  lb.trailer.position.copy(K);
  lb.trailer.rotation.set(0, th, tp, 'YXZ');
  lb.root.updateMatrixWorld(true);
  return { K, T, heading: th, centre: new Vector3().addVectors(K, T).multiplyScalar(0.5).setY((K.y - ly + T.y) / 2) };
}
/** Drive-bogie arc length on the lane when parked in the yard. */
export const S0 = (() => { let lo = 0, hi = 100; const v = new Vector3(); for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; if (lane.at(m, v).x < TRUCK0 + 3.875) lo = m; else hi = m; } return lo; })();
/** Distance driven for scroll p: away at 0.62, cruising through ch. 3, easing to a crawl as the camera rises. */
export const travel = (() => {
  const N = 2000, acc = new Float64Array(N + 1);
  const v = (p: number) => sstep(0.62, 0.71, p) * (1 - 0.65 * sstep(0.8, 0.9, p));
  for (let i = 1; i <= N; i++) acc[i] = acc[i - 1] + v(i / N);
  const k = 268 / acc[N]; // stops short of the hairpin, where a 17 m rig would sweep the verge
  return (p: number) => { const f = clamp(p) * N, i = Math.min(N - 1, Math.floor(f)); return lerp(acc[i], acc[i + 1], f - i) * k; };
})();
export { ROAD_W, KEEP_LEFT, nearRoad, lane };

export const create: Factory = async (canvas, ctx) => {
  const { renderer, scene, dispose } = createRenderer(canvas, ctx, { envIntensity: 0.28 });
  const camera = new PerspectiveCamera(ctx.mobile ? 46 : 34, 1, 0.1, 3000);
  const fog = new Color('#5d666e');
  scene.background = fog;
  scene.fog = new FogExp2(fog, 0.0055);
  const sky = makeSky({ top: '#2b3540', horizon: '#8b9196', glow: '#e7a06a', sunDir: new Vector3(0.9, 0.08, 0.3) });
  sky.mat.uniforms.uGlowAmt.value = 0.6;
  scene.add(sky.mesh);
  const L = makeLights(scene, ctx, { sun: '#ffc796', sunI: 2.8, hemiI: 0.55, sky: '#a8b6c4', ground: '#2f2a24', extent: 26, far: 140 });
  const sunDir = new Vector3(40, 14, 12);
  // the Shivalik front and the Kumaon hills rise north of Haldwani
  const front = makeRidges({ seed: 41, layers: [
    { z: 0, base: 10, amp: 60, col: '#2c3634', freq: 0.008 },
    { z: -140, base: 40, amp: 90, col: '#3f4a51', freq: 0.006 },
    { z: -320, base: 80, amp: 140, col: '#5c6872', freq: 0.004, snow: true },
  ] });
  front.grp.position.set(100, -8, -380);
  scene.add(front.grp);
  await yieldToMain();

  /* ---------------- yard ---------------- */
  scene.add(heightfield({ w: 560, d: 460, cx: 110, cz: -110, res: ctx.lite ? 2.6 : 1.6 }, heightAt, (x, z, y, sl, c) => {
    const n = fbm(x * 0.2, z * 0.2, 3);
    if (Math.abs(x) < 32 && Math.abs(z) < 22) return c.set('#78736a').lerp(new Color('#5f5b54'), n * 0.7);
    const r = nearRoad(x, z);
    if (r.d < ROAD_W / 2 + 1.6) return c.set('#6c6455').lerp(new Color('#57503f'), n); // murram shoulder and side drain
    const hill = sstep(-30, -90, z);
    c.set('#4c5737').lerp(new Color('#68663f'), n).lerp(new Color('#3a4630').lerp(new Color('#4d5236'), n), hill);
    // exposed cut faces and fill slopes: weathered phyllite / earth
    const bare = sstep(0.32, 0.6, sl) * (1 - sstep(16, 30, r.d));
    c.lerp(new Color('#6f6353').lerp(new Color('#857d70'), fbm(x * 0.5, y * 0.8, 3)), bare);
  }));
  await yieldToMain();
  scene.add(makeRoad(DENSE.slice(DENSE.findIndex((v) => v.x >= ROAD_START)).map((v) => v.clone()), ROAD_W));
  // PWD parapet blocks along the valley edge wherever the road stands on fill
  {
    const pts: [number, number, number, number][] = [];
    const cand: ([number, number, number, number] | null)[] = [];
    for (let i = 2; i < DENSE.length - 2; i += 2) {
      const a = DENSE[i - 1], b = DENSE[i + 1], p = DENSE[i];
      const dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz);
      const lx = dz / L, lz = -dx / L; // left of travel
      const off = 13, hl = natural(p.x + lx * off, p.z + lz * off), hr = natural(p.x - lx * off, p.z - lz * off);
      const side = hl < hr ? 1 : -1, o = ROAD_W / 2 + 0.55;
      cand.push(p.x < ROAD_START + 8 || p.y - Math.min(hl, hr) < 1.1 ? null : [p.x + lx * o * side, p.y, p.z + lz * o * side, Math.atan2(-dz, dx)]);
    }
    // only continuous runs along a drop; 1.8 m blocks at 3 m centres
    for (let i = 0; i < cand.length;) {
      if (!cand[i]) { i++; continue; }
      let j = i; while (j < cand.length && cand[j]) j++;
      if (j - i >= 8) for (let k = i; k < j; k += 2) pts.push(cand[k]!);
      i = j;
    }
    const blk = new InstancedMesh(new BoxGeometry(1.8, 0.6, 0.4), addGrain(new MeshStandardMaterial({ color: '#ffffff', roughness: 0.85 }), { scale: 3, strength: 0.18 }), pts.length);
    blk.instanceColor = new InstancedBufferAttribute(new Float32Array(pts.length * 3), 3);
    const o3 = new Object3D(), white = new Color('#d6d2c8'), black = new Color('#2a2a28');
    pts.forEach(([x, y, z, h], i) => { o3.position.set(x, y + 0.27, z); o3.rotation.set(0, h, 0); o3.updateMatrix(); blk.setMatrixAt(i, o3.matrix); blk.setColorAt(i, i % 2 ? black : white); });
    blk.castShadow = true; blk.receiveShadow = true;
    scene.add(blk);
  }
  // kilometre stones on the left verge (yellow cap: national highway)
  {
    const stoneM = addGrain(new MeshStandardMaterial({ color: '#dcd8cf', roughness: 0.8 }), { scale: 4, strength: 0.15 });
    const capM = new MeshStandardMaterial({ color: '#d9a72b', roughness: 0.7 });
    for (const s of [70, 175, 290]) {
      const p = lane.at(s), q = lane.at(s + 1), h = Math.atan2(-(q.z - p.z), q.x - p.x);
      const g = new Group();
      const body = new Mesh(new BoxGeometry(0.2, 0.6, 0.5), stoneM);
      body.position.y = 0.3;
      g.add(body);
      const cap = new Mesh(new CylinderGeometry(0.25, 0.25, 0.2, 16, 1, false, 0, PI), capM);
      cap.rotation.set(0, 0, PI / 2); cap.position.y = 0.6;
      g.add(cap);
      const o = ROAD_W / 2 - KEEP_LEFT + 0.9, x = p.x - Math.sin(h) * o, z = p.z - Math.cos(h) * o; // just off the left edge
      g.position.set(x, heightAt(x, z), z);
      g.rotation.y = h;
      g.traverse((c) => { c.castShadow = true; });
      scene.add(g);
    }
  }
  // hardstand slab in front of the workshop
  const slab = new Mesh(new BoxGeometry(22, 0.08, 10), addGrain(new MeshStandardMaterial({ color: '#9a968c', roughness: 0.9 }), { scale: 3, strength: 0.18 }));
  slab.position.set(-13, 0.04, 9);
  slab.receiveShadow = true;
  scene.add(slab);
  // compound wall with a gate opening on the road side
  const wallM = addGrain(new MeshStandardMaterial({ color: '#bdb6a8', roughness: 0.9 }), { scale: 2, strength: 0.15 });
  const wall = (x: number, z: number, w: number, d: number) => { const m = new Mesh(new BoxGeometry(w, 2.1, d), wallM); m.position.set(x, 1.05, z); m.castShadow = true; m.receiveShadow = true; scene.add(m); };
  wall(0, -22, 64, 0.3); wall(0, 22, 64, 0.3); wall(-32, 0, 0.3, 44); wall(32, -8, 0.3, 28); wall(32, 19.5, 0.3, 5);
  for (const z of [6.2, 16.6]) { const pier = new Mesh(new BoxGeometry(0.7, 2.6, 0.7), wallM); pier.position.set(32, 1.3, z); scene.add(pier); }
  const shed = buildShed({ bays: 4, bay: 6, span: 16, eave: 7 });
  shed.root.position.set(-28, 0, -10);
  shed.built(1);
  scene.add(shed.root);
  const office = buildContainer();
  office.position.set(22, 0, -16);
  scene.add(office);
  const store = buildContainer('#6a6152');
  store.position.set(22, 0, -12.5);
  scene.add(store);
  // drums and spare tyres
  const drumM = new MeshStandardMaterial({ color: '#3d5a6b', roughness: 0.6, metalness: 0.4 });
  for (let i = 0; i < 6; i++) { const d = new Mesh(new CylinderGeometry(0.29, 0.29, 0.88, 16), drumM); d.position.set(16 + (i % 3) * 0.64, 0.44, -6 + Math.floor(i / 3) * 0.64); d.castShadow = true; scene.add(d); }
  scene.add(makeCones([[28, 6.5], [28, 14], [26, 10], [-2, 4]]));
  // floodlight masts over the inspection bay
  const mastM = new MeshStandardMaterial({ color: '#6b7177', metalness: 0.6, roughness: 0.4 });
  const lampM = new MeshStandardMaterial({ color: '#fff6e2', emissive: new Color('#fff1d0'), emissiveIntensity: 2 });
  for (const [x, z] of [[-20, 3], [-4, 3]]) {
    const mast = new Mesh(new CylinderGeometry(0.1, 0.16, 9, 8), mastM); mast.position.set(x, 4.5, z); mast.castShadow = true; scene.add(mast);
    const head = new Mesh(new BoxGeometry(1.2, 0.3, 0.4), lampM); head.position.set(x, 9, z + 0.3); scene.add(head);
  }
  /* ---------------- low-bed and camera path ---------------- */
  const vm = vehicleMats();
  const lowbed = buildLowbed(vm);
  scene.add(lowbed.root);
  placeRig(lowbed, S0); // parked at x = TRUCK0, z = LANE
  // final aerial: from behind the low-bed's last position, looking up the road to the site
  const AERIAL = (() => {
    const end = placeRig(lowbed, S0 + travel(1)).centre;
    placeRig(lowbed, S0);
    const t = end.clone().lerp(SITE, 0.25);
    return [(Math.atan2(end.z - SITE.z, end.x - SITE.x) * 180) / PI, 18, 140, t.x, t.y + 3, t.z];
  })();
  /* camera: [p, az, el, dist, tx, ty, tz] — absolute targets until the chase in ch. 3 */
  const cam = [
    [0.0, 104, 20, 92, 4, 2, -24],
    [0.18, 92, 14, 84, 20, 6, -50],
    [0.24, 52, 14, 15, -15, 1.6, LANE],
    [0.4, 128, 18, 14, -15, 1.6, LANE],
    [0.47, 70, 16, 22, -5, 1.5, LANE],
    [0.6, 100, 22, 26, 0, 1.5, LANE],
    [0.66, 120, 14, 30, 8, 2, LANE],
  ];

  const camKeys = (p: number, rig: ReturnType<typeof placeRig>) => {
    let k = track(cam, p);
    if (p > 0.6) {
      // chase: off the low-bed's right rear quarter, turning with it as the road turns
      const q = seg(p, 0.66, 0.86), c = rig.centre;
      const follow = [lerp(120, 150, q) - (rig.heading * 180) / PI, lerp(14, 9, q), lerp(30, 34, q), c.x, c.y + 2.4, c.z];
      k = k.map((v, i) => lerp(v, follow[i], sstep(0.6, 0.7, p)));
      // then rise behind it: the road climbing ahead, and the site at its head
      k = k.map((v, i) => lerp(v, AERIAL[i], sstep(0.86, 1, p)));
    }
    return k;
  };
  // portrait screens stand further back; a little more while the whole 17 m rig is in shot
  const camMul = (p: number) => (ctx.mobile ? 1.3 + 0.25 * sstep(0.6, 0.7, p) * (1 - sstep(0.86, 1, p)) : 1);
  // sight lines from the dispatch camera to the rig (both framings), so no tree stands in them
  const sight: [Vector3, Vector3][] = [];
  {
    const eye = { position: new Vector3(), lookAt() {} };
    for (let p = 0.6; p <= 1.0001; p += 0.004) {
      const rig = placeRig(lowbed, S0 + travel(p)), k = camKeys(p, rig);
      for (const m of [1, 1.3 + 0.25 * sstep(0.6, 0.7, p) * (1 - sstep(0.86, 1, p))]) {
        orbit(eye, [k[0], k[1], k[2] * m, k[3], k[4], k[5]]);
        for (const t of [new Vector3(k[3], k[4], k[5]), rig.K.clone().setY(rig.K.y + 2), rig.T.clone().setY(rig.T.y + 1)]) sight.push([eye.position.clone(), t]);
      }
    }
    placeRig(lowbed, S0);
  }
  const inSight = (x: number, y: number, z: number, sc: number) => {
    const top = y + 6 * sc, rad = 1.3 * sc + 1;
    for (const [a, b] of sight) {
      const ex = b.x - a.x, ez = b.z - a.z, t = clamp(((x - a.x) * ex + (z - a.z) * ez) / (ex * ex + ez * ez || 1));
      if (Math.hypot(a.x + ex * t - x, a.z + ez * t - z) < rad && lerp(a.y, b.y, t) < top) return true;
    }
    return false;
  };

  const clear = (x: number, z: number, m: number) => nearRoad(x, z).d < ROAD_W / 2 + m || Math.hypot(x - SITE.x, z - SITE.z) < 26 || (Math.abs(x) < 38 && Math.abs(z) < 28);
  // chir pine and oak on the foothills
  scene.add(makeForest(ctx.lite ? 440 : 1000, (i) => {
    const x = -200 + hash(i, 1) * 600, z = -330 + hash(i, 2) * 270, sc = 2 + hash(i, 3) * 2.2;
    if (fbm(x * 0.02, z * 0.02) < 0.42 || clear(x, z, 6)) return null;
    const y = heightAt(x, z);
    return inSight(x, y, z, sc) ? null : [x, y, z, sc];
  }, { broad: 0.3 }));
  // sal on the plain south of the yard, and trees lining the road out of the gate
  scene.add(makeForest(ctx.lite ? 120 : 280, (i) => {
    const x = -80 + hash(i, 4) * 400, z = -60 + hash(i, 5) * 150;
    const sc = 2 + hash(i, 6) * 2;
    if (clear(x, z, 7) || (z < 30 && (x < 44 || nearRoad(x, z).d > 24 || fbm(x * 0.05, z * 0.05) < 0.45))) return null;
    const y = heightAt(x, z);
    return inSight(x, y, z, sc) ? null : [x, y, z, sc];
  }, { broad: 0.6 }));
  // loose rock on and below the cut faces
  scene.add(makeRocks(ctx.lite ? 60 : 140, (i) => {
    const r = DENSE[Math.floor(hash(i, 7) * DENSE.length)];
    if (r.z > -36) return null;
    const a = hash(i, 8) * PI * 2, d = ROAD_W / 2 + 2.2 + hash(i, 9) * 9;
    const x = r.x + Math.cos(a) * d, z = r.z + Math.sin(a) * d;
    if (nearRoad(x, z).d < ROAD_W / 2 + 1.8) return null;
    const y = heightAt(x, z);
    if (y - r.y < 0.6) return null;
    return [x, y, z, 0.25 + hash(i, 10) * 0.6];
  }, '#6f6a60'));
  await yieldToMain();

  // site beacon on the hills
  const beacon = new Group();
  beacon.position.set(SITE.x, heightAt(SITE.x, SITE.z), SITE.z);
  const beamM = new ShaderMaterial({
    transparent: true, depthWrite: false, blending: AdditiveBlending,
    uniforms: { uA: { value: 0 } },
    vertexShader: 'varying float vY; void main(){ vY = position.y / 60.0 + 0.5; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'varying float vY; uniform float uA; void main(){ gl_FragColor = vec4(vec3(1.0, 0.62, 0.32) * 2.0, pow(1.0 - vY, 1.5) * uA); }',
  });
  const beam = new Mesh(new CylinderGeometry(3, 3, 60, 12, 1, true), beamM);
  beam.scale.y = 2.4;
  beam.position.y = 90;
  const orb = new Mesh(new SphereGeometry(5, 16, 12), new MeshStandardMaterial({ color: '#ffb27a', emissive: new Color('#ff8a3d'), emissiveIntensity: 4, fog: false }));
  orb.position.y = 22;
  beacon.add(beam, orb);
  scene.add(beacon);

  /* ---------------- vehicles ---------------- */
  const pickup = buildPickup(vm);
  pickup.root.position.set(15, 0, -4);
  pickup.root.rotation.y = -PI / 2;
  scene.add(pickup.root);
  const machine = buildBackhoe(makeMaterials());
  scene.add(machine.root);
  const dust = new Dust(ctx.lite ? 120 : 200, '#a39580');
  scene.add(dust.points);

  // inspection light: a spot that sweeps the machine
  const spot = new SpotLight('#fff0d8', 0, 30, 0.32, 0.6, 1.2);
  spot.position.set(-12, 9, 3);
  scene.add(spot, spot.target);

  const rampEnd = TRUCK0 - 9.15; // deck rear edge (x) when parked
  const rampLen = 2.3 * Math.cos(Math.asin(lowbed.deckY / 2.3));
  const deckSeat = TRUCK0 + lowbed.deckX + 1.4; // where the machine sits on the deck
  const path = pathTrack([
    [0, -15, LANE, 0], [0.43, -15, LANE, 0], [0.56, deckSeat - 0.0, LANE, 0], [1, deckSeat, LANE, 0],
  ]);

  try { await renderer.compileAsync(scene, camera); } catch { /* first frame */ }

  const poseAt = (p: number) => {
    const m = path(p);
    let y = 0, tilt = 0;
    const rx = m.x; // machine origin; ramp maths on the origin is close enough at this scale
    if (rx > rampEnd - rampLen && rx < rampEnd) { const k = (rx - (rampEnd - rampLen)) / rampLen; y = k * lowbed.deckY; tilt = Math.atan2(lowbed.deckY, rampLen) * Math.sin(k * PI) * 0.9; }
    else if (rx >= rampEnd) y = lowbed.deckY;
    // under the floodlights the backhoe arm lifts clear, showing the machine for the job
    const chk = seg(p, 0.22, 0.4);
    const stab = 0;
    const r = hoeIK(4.8, 1.2, -1.4);
    const arm = Math.sin(clamp((chk - 0.3) / 0.4) * PI);
    const loaderLift = 0.18;
    const pose: Pose = {
      ...BASE, x: m.x, y, z: m.z, heading: m.heading, odo: m.odo, steer: m.steer, tilt, stab,
      boom: lerp(1.18, r.boom, arm), dipper: lerp(-2.72, r.dipper, arm), hoeBucket: lerp(-1.7, r.hoeBucket, arm), swing: Math.sin(arm * PI) * 0.5 * arm,
      loaderLift, pitch: clamp(-m.speed * 0.0004, -0.01, 0.01),
    };
    // riding on the low-bed once loaded: seated on the deck, in the trailer's own frame
    if (p > 0.6) Object.assign(pose, { x: deckSeat - TRUCK0 - lowbed.kingpin.x, y: lowbed.deckY - lowbed.kingpin.y, z: 0, heading: 0, steer: 0, tilt: 0, pitch: 0 });
    return pose;
  };

  return {
    resize(w, h) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      if (ctx.capture) camera.clearViewOffset();
      else if (ctx.mobile) camera.setViewOffset(w, h, 0, h * 0.2, w, h);
      else camera.setViewOffset(w, h, -w * 0.15, 0, w, h);
      camera.updateProjectionMatrix();
    },
    render(p, dt, now) {
      const d = travel(p);
      const rig = placeRig(lowbed, S0 + d);
      lowbed.roll(d);
      const pose = poseAt(p);
      const carrier = p > 0.6 ? lowbed.trailer : scene;
      if (machine.root.parent !== carrier) carrier.add(machine.root);
      machine.apply(pose);
      lowbed.ramps(sstep(0.41, 0.45, p) * (1 - sstep(0.57, 0.61, p)));
      // inspection sweep
      const ins = seg(p, 0.2, 0.42);
      spot.intensity = Math.sin(ins * PI) * 180;
      spot.target.position.set(-17 + ins * 6, 1, LANE);
      // beacon breathes during the requirement chapter and while en route
      const ba = (1 - sstep(0.2, 0.26, p)) + sstep(0.64, 0.7, p) * 0.9;
      beamM.uniforms.uA.value = ba * (0.55 + 0.45 * Math.sin(now / 420));
      orb.visible = ba > 0.02;
      // dust behind moving vehicles
      if (dt > 0 && p > 0.62 && travel(p) - travel(p - 0.004) > 0.15) dust.emit(rig.T.x, rig.T.y + 0.4, rig.T.z, 2, 2, 0.6, 2.4);
      dust.step(dt);

      const k = camKeys(p, rig);
      orbit(camera, [k[0], k[1], k[2] * camMul(p), k[3], k[4], k[5]]);
      // never below the hillside
      const gy = heightAt(camera.position.x, camera.position.z) + 2.5;
      if (camera.position.y < gy) { camera.position.y = gy; camera.lookAt(k[3], k[4], k[5]); }
      if (p > 0.6) L.follow(rig.centre.x, rig.centre.y, rig.centre.z, sunDir);
      else L.follow(clamp(pose.x ?? 0, -40, 400), 0, LANE * 0.5, sunDir);
      renderer.render(scene, camera);
      return ba > 0.02 || dust.alive > 0;
    },
    hud(p) {
      const st = (a: number, b: number) => (p >= b ? 'Done' : p >= a ? 'In progress' : 'Pending');
      return { avail: p >= 0.12 ? 'Checked' : 'Checking', check: p >= 0.3 ? 'In the quote' : 'Pending', route: p >= 0.62 ? 'Planned' : st(0.4, 0.62), support: p >= 0.84 ? 'Settled' : 'Pending' };
    },
    dispose,
  };
};
