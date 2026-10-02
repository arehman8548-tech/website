/**
 * Why RBE — the organisation behind the machine, at the Haldwani base.
 *
 *  0 Requirement     dawn over the yard; a site beacon on the hills to the north
 *  1 Planning        the machine for the job, under the floodlights
 *  2 Mobilisation    ramps down, machine drives onto the low-bed, ramps up
 *  3 Deployment      the low-bed leaves through the gate for the hills
 *  4 Project support the camera rises: the route ahead to the site, terms settled
 *
 * Only what RBE states on the site is shown: no inspection routine, fleet size
 * or service-vehicle commitments are implied.
 */
import { AdditiveBlending, BoxGeometry, Color, CylinderGeometry, FogExp2, Group, Mesh, MeshStandardMaterial, PerspectiveCamera, ShaderMaterial, SphereGeometry, SpotLight, Vector3 } from 'three';
import {
  addGrain, clamp, createRenderer, Dust, fbm, hash, heightfield, lerp, makeCones, makeForest, makeLights, makeRidges, makeRoad, makeSky, orbit, pathTrack, seg, sstep, track, yieldToMain,
} from '../three/kit';
import { buildContainer, buildLowbed, buildPickup, buildShed, vehicleMats } from '../three/vehicles';
import { buildBackhoe, hoeIK, makeMaterials, type Pose } from '../backhoe/model';
import type { Factory } from '../stage/runtime';

const PI = Math.PI;
const TRUCK0 = 8, LANE = 10; // low-bed parked at x = 8, z = 10, facing the gate (+x)
const SITE = new Vector3(190, 0, -300); // the site beacon, out on the hills
const BASE: Pose = { x: 0, loaderLift: 0.18, bucketWorld: 0.3, boom: 1.18, dipper: -2.72, hoeBucket: -1.7, swing: 0, stab: 0, pitch: 0 };

const truckX = (p: number) => TRUCK0 + Math.pow(sstep(0.62, 0.86, p), 1.6) * 230;

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
  scene.add(heightfield({ w: 600, d: 360, cx: 120, cz: -60, res: ctx.lite ? 3 : 2 }, (x, z) => (Math.abs(x) < 34 && Math.abs(z) < 24 ? 0 : (fbm(x * 0.02, z * 0.02) - 0.5) * 1.2), (x, z, _y, _s, c) => {
    const n = fbm(x * 0.2, z * 0.2, 3);
    if (Math.abs(x) < 32 && Math.abs(z) < 22) return c.set('#78736a').lerp(new Color('#5f5b54'), n * 0.7);
    return c.set('#4c5737').lerp(new Color('#68663f'), n);
  }));
  const road: Vector3[] = [];
  for (let x = 30; x <= 340; x += 6) road.push(new Vector3(x, 0, LANE + Math.max(0, x - 120) * -0.06));
  scene.add(makeRoad(road, 7));
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
  scene.add(makeForest(ctx.lite ? 300 : 700, (i) => {
    const x = -200 + hash(i, 1) * 600, z = -260 + hash(i, 2) * 200;
    if (fbm(x * 0.02, z * 0.02) < 0.45) return null;
    return [x, 0, z, 2 + hash(i, 3) * 2.2];
  }, { broad: 0.35 }));
  scene.add(makeForest(ctx.lite ? 80 : 200, (i) => {
    const x = -80 + hash(i, 4) * 400, z = 30 + hash(i, 5) * 60;
    return [x, 0, z, 2 + hash(i, 6) * 2];
  }, { broad: 0.6 }));
  await yieldToMain();

  // site beacon on the hills
  const beacon = new Group();
  beacon.position.copy(SITE);
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
  const vm = vehicleMats();
  const lowbed = buildLowbed(vm);
  lowbed.root.position.set(TRUCK0, 0, LANE);
  scene.add(lowbed.root);
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
    // riding on the low-bed once loaded
    const tx = truckX(p) - TRUCK0;
    if (p > 0.6) { pose.x = deckSeat + tx; pose.y = lowbed.deckY; pose.tilt = 0; pose.pitch = 0; }
    return pose;
  };

  /* camera: [p, az, el, dist, tx, ty, tz] — absolute targets, with a truck-follow term in ch. 3 */
  const cam = [
    [0.0, 104, 20, 92, 4, 2, -24],
    [0.18, 92, 14, 84, 20, 6, -50],
    [0.24, 52, 14, 15, -15, 1.6, LANE],
    [0.4, 128, 18, 14, -15, 1.6, LANE],
    [0.47, 70, 16, 22, -5, 1.5, LANE],
    [0.6, 100, 22, 26, 0, 1.5, LANE],
    [0.66, 120, 14, 30, 8, 2, LANE],
  ];

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
      const pose = poseAt(p);
      machine.apply(pose);
      const tx = truckX(p);
      lowbed.root.position.x = tx;
      lowbed.roll(tx - TRUCK0);
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
      if (dt > 0 && p > 0.62 && p < 0.86) dust.emit(tx - 10, 0.4, LANE, 2, 2, 0.6, 2.4);
      dust.step(dt);

      let k: number[];
      if (p < 0.66) k = track(cam, p);
      else if (p < 0.86) {
        // tracking alongside the low-bed as it heads for the hills
        const q = seg(p, 0.66, 0.86);
        k = [lerp(120, 150, q), lerp(14, 9, q), lerp(30, 34, q), tx - 2, 2.4, LANE - (tx > 120 ? (tx - 120) * 0.06 : 0)];
      } else {
        const q = seg(p, 0.86, 1);
        // rise above the departing low-bed to see the road ahead and the site on the hills
        const a = [150, 9, 34, truckX(0.86) - 2, 2.4, LANE];
        k = a.map((v, i) => lerp(v, [70, 16, 200, 213, 10, -150][i], sstep(0, 1, q)));
      }
      orbit(camera, [k[0], k[1], ctx.mobile ? k[2] * 1.3 : k[2], k[3], k[4], k[5]]);
      L.follow(clamp(pose.x ?? 0, -40, 400), 0, LANE * 0.5, sunDir);
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
