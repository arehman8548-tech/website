/**
 * How Rental Works — the journey of one rental, on one hill road.
 *
 *  0 Requirement      the client's plot at the top: setting-out pegs, a site pin
 *  1 Site information the camera surveys the access road down from the plot:
 *                     working area, last-mile surface, hairpin bends, road width
 *  2 Equipment plan   the machine at the foot of the road, terms in the quote
 *  3 Mobilisation     it climbs the switchbacks on its own wheels
 *  4 Arrival          into the plot; stabilisers down
 *  5 Work begins      foundation trench along the setting-out; hour meter running
 *  6 Support          wide view: the road, the site, the way back for return
 */
import { AdditiveBlending, BoxGeometry, BufferGeometry, CatmullRomCurve3, Color, CylinderGeometry, DoubleSide, Float32BufferAttribute, FogExp2, Mesh, MeshStandardMaterial, PerspectiveCamera, RingGeometry, ShaderMaterial, Vector3, Vector4 } from 'three';
import {
  clamp, createRenderer, Dust, Excavation, fbm, ground, hash, heightfield, lerp, makeCones, makeForest, makeHeap, makeLights, makeRidges, makeRoad, makeRocks,
  makeSettingOut, makeSky, orbit, seg, sstep, track, yieldToMain,
} from '../three/kit';
import { buildContainer } from '../three/vehicles';
import { buildBackhoe, hoeIK, makeMaterials, type Pose } from '../backhoe/model';
import type { Factory } from '../stage/runtime';

const PI = Math.PI;
const ROAD_W = 6;
const PLOT = { x: -16, z: -46, y: 33, w: 28, d: 20 };
const PARK = { x: -24, z: -42 }; // where the machine stops on the pad
const ctrl: [number, number, number][] = [
  [-90, 74, -0.5], [-60, 70, 0], [0, 66, 2.4], [34, 60, 4.6], [52, 50, 6.6], [36, 39, 9], [0, 33, 11.6], [-40, 27, 14.6], [-58, 16, 17.4],
  [-42, 4, 20.4], [-4, -2, 23.2], [30, -9, 26], [48, -20, 28.6], [32, -31, 31.4], [12, -39, 32.8], [-2, -42, 33],
];
const curve = new CatmullRomCurve3(ctrl.map(([x, z, y]) => new Vector3(x, y, z)), false, 'centripetal');
const LEN = curve.getLength();
const DENSE = curve.getSpacedPoints(Math.round(LEN / 1.5));
const BASE: Pose = { x: 0, loaderLift: 0.18, bucketWorld: 0.3, boom: 1.18, dipper: -2.72, hoeBucket: -1.7, swing: 0, stab: 0, pitch: 0 };

const h0 = (x: number, z: number) => 33 - (z + 40) * 0.31 + (fbm(x * 0.03, z * 0.03) - 0.5) * 9 + (z < -56 ? (-56 - z) * 0.4 : 0);
function heightAt(x: number, z: number) {
  let best = 1e9, by = 0;
  for (let i = 0; i < DENSE.length; i += 1) {
    const p = DENSE[i];
    const d = (p.x - x) * (p.x - x) + (p.z - z) * (p.z - z);
    if (d < best) { best = d; by = p.y; }
  }
  const d = Math.sqrt(best);
  let h = h0(x, z);
  const half = ROAD_W / 2 + 1.2;
  h = lerp(by - 0.03, h, sstep(half, half + 16, d));
  // the plot: a levelled pad cut into the slope
  const px = Math.max(0, Math.abs(x - PLOT.x) - PLOT.w / 2), pz = Math.max(0, Math.abs(z - PLOT.z) - PLOT.d / 2);
  const pd = Math.hypot(px, pz);
  return lerp(PLOT.y - 0.02, h, sstep(0, 7, pd));
}

/** Where along the road the machine is: arc-length fraction for p. */
const climb = (p: number) => sstep(0.42, 0.655, p);
const onPad = (p: number) => sstep(0.655, 0.69, p);

export const create: Factory = async (canvas, ctx) => {
  const { renderer, scene, dispose } = createRenderer(canvas, ctx, { envIntensity: 0.3 });
  renderer.toneMappingExposure = 1.04;
  const camera = new PerspectiveCamera(ctx.mobile ? 46 : 34, 1, 0.1, 3000);
  const fog = new Color('#5c656c');
  scene.background = fog;
  scene.fog = new FogExp2(fog, 0.0062);
  const sky = makeSky({ top: '#222c35', horizon: '#727a80', glow: '#e3a16b', sunDir: new Vector3(-0.8, 0.14, 0.4) });
  sky.mat.uniforms.uGlowAmt.value = 0.55;
  scene.add(sky.mesh);
  const L = makeLights(scene, ctx, { sun: '#ffcf9e', sunI: 2.9, hemiI: 0.48, sky: '#b0bfcc', ground: '#352f28', extent: 18, far: 120 });
  const sunDir = new Vector3(-30, 22, 14);
  const r1 = makeRidges({ seed: 61 });
  r1.grp.position.set(0, 20, -120);
  scene.add(r1.grp);
  await yieldToMain();

  /* ---------------- terrain, road, plot ---------------- */
  const trenchHole = new Vector4(0, 0, -1, -1);
  const terrain = heightfield({ w: 300, d: 260, cx: -10, cz: 0, res: ctx.lite ? 2.2 : 1.3 }, heightAt, (x, z, y, sl, c) => {
    const n = fbm(x * 0.15, z * 0.15, 3);
    const inPlot = Math.abs(x - PLOT.x) < PLOT.w / 2 && Math.abs(z - PLOT.z) < PLOT.d / 2;
    if (inPlot) return c.set('#7f725f').lerp(new Color('#615749'), n * 0.7);
    if (sl > 0.5) { const band = (Math.sin(y * 5 + n * 3) + 1) / 2; return c.set('#6d5c4a').lerp(new Color('#4f4639'), band).lerp(new Color('#45503a'), n * 0.5); }
    return c.set('#3e4932').lerp(new Color('#55573e'), n).lerp(new Color('#2b3628'), sstep(0.5, 0.75, n) * 0.6);
  }, ground([trenchHole]));
  scene.add(terrain);
  await yieldToMain();
  scene.add(makeRoad(DENSE.map((p) => p.clone()), ROAD_W));
  // trees everywhere except on the road bench and the plot
  const roadDist = (x: number, z: number) => { let b = 1e9; for (let i = 0; i < DENSE.length; i += 3) { const p = DENSE[i]; b = Math.min(b, Math.hypot(p.x - x, p.z - z)); } return b; };
  // camera stations must stay clear of the canopy
  const clear: [number, number][] = [[-92, 96], [-78, 90], [-30, 82], [-12, -20], [10, 60]];
  scene.add(makeForest(ctx.lite ? 700 : 1700, (i) => {
    const x = -150 + hash(i, 1) * 280, z = -120 + hash(i, 2) * 240;
    if (clear.some(([cx, cz]) => Math.hypot(x - cx, z - cz) < 22)) return null;
    if (roadDist(x, z) < 12 || (Math.abs(x - PLOT.x) < PLOT.w / 2 + 6 && Math.abs(z - PLOT.z) < PLOT.d / 2 + 6) || fbm(x * 0.04, z * 0.04) < 0.38) return null;
    return [x, heightAt(x, z), z, 1.5 + hash(i, 5) * 1.7];
  }, { broad: 0.16 }));
  scene.add(makeRocks(50, (i) => {
    const p = DENSE[Math.floor(hash(i, 3) * DENSE.length)];
    const side = hash(i, 4) < 0.5 ? -1 : 1, off = ROAD_W / 2 + 0.6 + hash(i, 5) * 1.5;
    const t = curve.getTangentAt(clamp(DENSE.indexOf(p) / DENSE.length)).normalize();
    const x = p.x - t.z * side * off, z = p.z + t.x * side * off;
    return [x, heightAt(x, z), z, 0.15 + hash(i, 6) * 0.35];
  }));
  const office = buildContainer('#5d6a5c');
  office.position.set(PLOT.x - 10, PLOT.y, PLOT.z - 6);
  scene.add(office);
  await yieldToMain();

  /* ---------------- machine & work ---------------- */
  const machine = buildBackhoe(makeMaterials());
  scene.add(machine.root);
  const dust = new Dust(ctx.lite ? 120 : 220);
  scene.add(dust.points);
  // the final working position inside the plot, and the trench it digs behind it
  // off the end of the road and across the pad, squared up to the plot
  const roadEnd = curve.getPointAt(1), roadT = curve.getTangentAt(1);
  const roadHeading = Math.atan2(-roadT.z, roadT.x);
  const endHeading = PI;
  const end = new Vector3(PARK.x, PLOT.y, PARK.z);
  const B = 4.3;
  const fwd = new Vector3(Math.cos(endHeading), 0, -Math.sin(endHeading));
  const trenchC = end.clone().addScaledVector(fwd, -B);
  const trench = new Excavation(1.0, 5.2, 1.2, '#6e5643', '#4b3c2e');
  trench.grp.position.set(trenchC.x, PLOT.y, trenchC.z);
  trench.grp.rotation.y = endHeading;
  scene.add(trench.grp);
  // the hole in the ground follows the trench footprint (axis-aligned approximation)
  const ex = Math.abs(Math.cos(endHeading)) * 0.5 + Math.abs(Math.sin(endHeading)) * 2.6;
  const ez = Math.abs(Math.sin(endHeading)) * 0.5 + Math.abs(Math.cos(endHeading)) * 2.6;
  trenchHole.set(trenchC.x, trenchC.z, -1, -1);
  const peg = (a: number, b: number) => { const v = trenchC.clone().addScaledVector(fwd, a).add(new Vector3(-fwd.z, 0, fwd.x).multiplyScalar(b)); return [v.x, v.z] as [number, number]; };
  const setting = makeSettingOut([peg(-0.8, -3.1), peg(0.8, -3.1), peg(0.8, 3.1), peg(-0.8, 3.1)], PLOT.y);
  scene.add(setting);
  const spoil = makeHeap('#715846', 7, 0.6);
  scene.add(spoil);
  scene.add(makeCones([[...peg(2.6, -3.6), PLOT.y] as [number, number, number], [...peg(2.6, 3.6), PLOT.y] as [number, number, number], [...peg(-2.4, 4.0), PLOT.y] as [number, number, number]]));

  // site pin (requirement)
  const pinBeamM = new ShaderMaterial({
    transparent: true, depthWrite: false, blending: AdditiveBlending,
    uniforms: { uA: { value: 1 } },
    vertexShader: 'varying float vY; void main(){ vY = position.y + 0.5; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'varying float vY; uniform float uA; void main(){ gl_FragColor = vec4(vec3(1.0, 0.6, 0.32) * 1.5, (1.0 - vY) * uA * 0.9); }',
  });
  const pinStem = new Mesh(new CylinderGeometry(0.12, 0.12, 1, 10, 1, true), pinBeamM);
  pinStem.scale.y = 14;
  pinStem.position.set(PLOT.x, PLOT.y + 7, PLOT.z);
  const ringM = new ShaderMaterial({
    transparent: true, depthWrite: false, blending: AdditiveBlending, side: DoubleSide,
    uniforms: { uA: { value: 1 }, uT: { value: 0 } },
    vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'varying vec2 vP; uniform float uA; uniform float uT; void main(){ float r = length(vP) / 6.0; float ring = smoothstep(0.03, 0.0, abs(r - fract(uT))) * (1.0 - fract(uT)); gl_FragColor = vec4(1.0, 0.6, 0.32, ring * uA); }',
  });
  const pin = new Mesh(new RingGeometry(0, 6, 64), ringM);
  pin.rotation.x = -PI / 2;
  pin.position.set(PLOT.x, PLOT.y + 0.08, PLOT.z);
  scene.add(pin, pinStem);

  // survey line drawn down the access road during "site information"
  const surveyMat = new ShaderMaterial({
    transparent: true, depthWrite: false, side: DoubleSide, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4,
    uniforms: { uFrom: { value: 1 }, uColor: { value: new Color('#e08a4f') }, uA: { value: 1 } },
    vertexShader: 'attribute float aU; varying float vU; void main(){ vU = aU; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'varying float vU; uniform float uFrom; uniform vec3 uColor; uniform float uA; void main(){ if (vU < uFrom) discard; float head = smoothstep(uFrom + 0.02, uFrom, vU); gl_FragColor = vec4(uColor * (1.0 + head * 1.5), 0.85 * uA); }',
  });
  {
    const pos: number[] = [], us: number[] = [], idx: number[] = [];
    DENSE.forEach((p, i) => {
      const a = DENSE[Math.max(0, i - 1)], b = DENSE[Math.min(DENSE.length - 1, i + 1)];
      const dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1;
      for (const s of [-1, 1]) { pos.push(p.x - (dz / l) * s * 0.35, p.y + 0.06, p.z + (dx / l) * s * 0.35); us.push(i / (DENSE.length - 1)); }
      if (i < DENSE.length - 1) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    });
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(pos, 3));
    g.setAttribute('aU', new Float32BufferAttribute(us, 1));
    g.setIndex(idx);
    const m = new Mesh(g, surveyMat);
    m.renderOrder = 4;
    scene.add(m);
  }
  // road-width gauge across the carriageway
  const gaugeAt = 0.38;
  const gp = curve.getPointAt(gaugeAt), gt = curve.getTangentAt(gaugeAt);
  const gauge = new Mesh(new BoxGeometry(ROAD_W + 0.6, 0.05, 0.08), new MeshStandardMaterial({ color: '#e08a4f', emissive: new Color('#e08a4f'), emissiveIntensity: 1.2 }));
  gauge.position.set(gp.x, gp.y + 0.3, gp.z);
  gauge.rotation.y = Math.atan2(-gt.z, gt.x) + PI / 2;
  scene.add(gauge);
  const ticks = [-1, 1].map((s) => {
    const tick = new Mesh(new BoxGeometry(0.06, 0.7, 0.06), gauge.material);
    const k = (ROAD_W / 2 + 0.3) / gt.length();
    tick.position.set(gp.x - gt.z * s * k, gp.y + 0.35, gp.z + gt.x * s * k);
    scene.add(tick);
    return tick;
  });

  // label anchors (HTML overlay)
  const anchors: Record<string, { v: Vector3; a: number; b: number }> = {
    work: { v: new Vector3(PLOT.x, PLOT.y + 2, PLOT.z), a: 0.15, b: 0.2 },
    last: { v: curve.getPointAt(0.93).add(new Vector3(0, 2, 0)), a: 0.18, b: 0.23 },
    bends: { v: curve.getPointAt(0.775).add(new Vector3(0, 2, 0)), a: 0.21, b: 0.26 },
    width: { v: gp.clone().add(new Vector3(0, 2.2, 0)), a: 0.24, b: 0.29 },
    route: { v: curve.getPointAt(0.05).add(new Vector3(0, 2, 0)), a: 0.27, b: 0.31 },
  };
  const labels = new Map<string, HTMLElement>();
  ctx.root.querySelectorAll<HTMLElement>('[data-label]').forEach((el) => labels.set(el.dataset.label!, el));

  try { await renderer.compileAsync(scene, camera); } catch { /* first frame */ }

  const padLen = Math.hypot(PARK.x - roadEnd.x, PARK.z - roadEnd.z);
  const poseAt = (p: number): Pose & { dug: number; local: number; s: number } => {
    const u = climb(p);
    const pt = curve.getPointAt(u).clone(), tg = curve.getTangentAt(u);
    let heading = Math.atan2(-tg.z, tg.x);
    const v = onPad(p);
    if (v > 0) {
      pt.set(lerp(roadEnd.x, PARK.x, v), PLOT.y, lerp(roadEnd.z, PARK.z, v));
      let d = endHeading - roadHeading; if (d > PI) d -= 2 * PI; if (d < -PI) d += 2 * PI;
      heading = roadHeading + d * sstep(0, 0.7, v);
    }
    const ahead = curve.getTangentAt(Math.min(1, u + 0.004));
    let dh = Math.atan2(-ahead.z, ahead.x) - heading;
    if (dh > PI) dh -= 2 * PI; if (dh < -PI) dh += 2 * PI;
    const steer = clamp((dh / (0.004 * LEN)) * 2.25 * 1.0, -0.55, 0.55) * (u > 0 && u < 1 ? 1 : 0);
    const tilt = Math.atan2(tg.y, Math.hypot(tg.x, tg.z));
    const stab = sstep(0.69, 0.73, p);
    let arm = { boom: 1.18, dipper: -2.72, hoeBucket: -1.7 }, swing = 0, hoeFill = 0, dug = 0, local = -1;
    if (p > 0.72) {
      const r = hoeIK(B + 1.4, 1, -1.2, 0.05), k = sstep(0.72, 0.76, p);
      arm = { boom: lerp(1.18, r.boom, k), dipper: lerp(-2.72, r.dipper, k), hoeBucket: lerp(-1.7, r.hoeBucket, k) };
    }
    if (p > 0.76) {
      // three passes, each moving along the trench line
      const kk = seg(p, 0.76, 0.9) * 3, i = Math.min(2, Math.floor(kk)); local = p >= 0.9 ? 1 : kk - i;
      const d0 = (i * 1.2) / 3, d1 = ((i + 1) * 1.2) / 3;
      const sw = [-0.28, 0, 0.28][i];
      const [back, h, phi, s, f] = track([
        [0, B + 1.2, 1, -1.2, sw, 0], [0.16, B + 1.2, -d0 + 0.05, -1.35, sw, 0], [0.44, B - 0.9, -d1, -2.45, sw, 0.6], [0.56, B - 0.7, 0.9, -3.05, sw, 1],
        [0.7, B - 0.1, 1.9, -3.05, 1.2, 1], [0.83, B - 0.1, 1.9, -0.25, 1.2, 0], [1, B + 1.2, 1, -1.2, sw, 0],
      ], local);
      arm = hoeIK(back, h, phi, 0.05); swing = s; hoeFill = f; dug = lerp(d0, d1, sstep(0.16, 0.44, local));
      if (p >= 0.9) dug = 1.2;
    }
    if (p > 0.92) { const r = hoeIK(B - 0.4, 1.6, -2.6, 0.05), k = sstep(0.92, 0.97, p); arm = { boom: lerp(arm.boom, r.boom, k), dipper: lerp(arm.dipper, r.dipper, k), hoeBucket: lerp(arm.hoeBucket, r.hoeBucket, k) }; swing = lerp(swing, 0, k); }
    return { ...BASE, x: pt.x, y: pt.y, z: pt.z, heading, odo: u * LEN + v * padLen, steer: v > 0 ? 0 : steer, tilt: v > 0 ? 0 : tilt, stab, swing, hoeFill, ...arm, dug, local, s: u + (v * padLen) / LEN };
  };

  let measured = false;
  const spoilAt = new Vector3();
  const tmp = new Vector3(), lv = new Vector3();
  let W = 1, H = 1;
  /* camera: [p, az, el, dist, tx, ty, tz] absolute, or machine-follow during the climb */
  const plotCam = [PLOT.x + 2, PLOT.y + 1, PLOT.z + 2];
  const camStatic = [
    [0.0, 70, 16, 34, ...plotCam],
    [0.13, 110, 22, 30, ...plotCam],
    [0.17, 90, 34, 70, PLOT.x + 10, PLOT.y - 4, PLOT.z + 20],
    [0.31, 100, 40, 120, -6, 12, 20],
    [0.34, 96, 14, 22, ctrl[0][0] + 2, 1.2, ctrl[0][1]],
    [0.42, 60, 20, 22, ctrl[0][0] + 6, 1.4, ctrl[0][1]],
  ];
  const camEnd = [
    [0.68, 60, 26, 26, ...plotCam],
    [0.74, 40, 20, 18, trenchC.x, PLOT.y + 0.5, trenchC.z],
    [0.9, 80, 30, 15, trenchC.x, PLOT.y + 0.2, trenchC.z],
    [0.94, 90, 34, 60, PLOT.x + 6, PLOT.y - 6, PLOT.z + 24],
    [1.0, 104, 38, 150, -6, 10, 14],
  ];

  return {
    resize(w, h) {
      W = w; H = h;
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
      trench.set(pose.dug);
      const open = pose.dug > 0.004;
      trenchHole.z = open ? ex : -1; trenchHole.w = open ? ez : -1;
      if (!measured) {
        machine.apply({ ...pose, ...poseAt(0.95), ...hoeIK(B - 0.1, 1.9, -0.25, 0.05), swing: 1.2 });
        spoilAt.copy(machine.hoeTip());
        machine.apply(pose);
        measured = true;
      }
      const f = clamp(pose.dug / 1.2);
      spoil.visible = f > 0.03;
      spoil.position.set(spoilAt.x, PLOT.y, spoilAt.z);
      spoil.scale.set(0.6 + f * 1.3, 0.4 + f * 0.7, 0.6 + f * 1.1);
      // pin pulses during the requirement, survey line runs down the road during site information
      const pinA = 1 - sstep(0.14, 0.18, p);
      pin.visible = pinStem.visible = pinA > 0.02;
      ringM.uniforms.uT.value = now / 1600;
      ringM.uniforms.uA.value = pinBeamM.uniforms.uA.value = pinA;
      surveyMat.uniforms.uFrom.value = 1 - sstep(0.15, 0.3, p);
      surveyMat.uniforms.uA.value = 1 - sstep(0.4, 0.46, p) + sstep(0.93, 0.98, p) * 0.7;
      const gv = sstep(0.24, 0.26, p) * (1 - sstep(0.3, 0.33, p));
      gauge.visible = gv > 0.01;
      ticks.forEach((t) => (t.visible = gauge.visible));
      // dust behind the wheels while climbing, from the bucket while digging
      if (dt > 0 && p > 0.42 && p < 0.68) dust.emit(pose.x!, pose.y! + 0.3, pose.z!, 1, 1.2, 0.4, 1.6);
      if (dt > 0 && pose.local > 0.16 && pose.local < 0.44) { const tp = machine.hoeTip(); dust.emit(tp.x, PLOT.y + 0.1, tp.z, 1, 0.5, 0.5, 1); }
      dust.step(dt);

      let k: number[];
      if (p < 0.42) k = track(camStatic, p);
      else if (p < 0.68) {
        // chase camera: behind and above the machine, swinging wide on the hairpins
        const q = seg(p, 0.42, 0.68);
        const az = (pose.heading! * 180) / PI + 180 + Math.sin(q * PI * 3) * 30;
        k = [-az, lerp(40, 46, q), 27, pose.x!, pose.y! + 1.5, pose.z!];
        if (p < 0.45) k = k.map((v, i) => lerp(track(camStatic, 0.42)[i], v, sstep(0.42, 0.45, p)));
        if (p > 0.66) k = k.map((v, i) => lerp(v, track(camEnd, 0.68)[i], sstep(0.66, 0.68, p)));
      } else k = track(camEnd, p);
      orbit(camera, [k[0], k[1], ctx.mobile ? k[2] * 1.3 : k[2], k[3], k[4], k[5]], tmp);
      // never let the camera sink into the hillside
      const gy = heightAt(camera.position.x, camera.position.z) + 3;
      if (camera.position.y < gy) { camera.position.y = gy; camera.lookAt(tmp.set(k[3], k[4], k[5])); }
      camera.updateMatrixWorld();
      L.follow(pose.x!, pose.y!, pose.z!, sunDir);
      renderer.render(scene, camera);

      // site-information labels
      for (const [key, a] of Object.entries(anchors)) {
        const el = labels.get(key);
        if (!el) continue;
        lv.copy(a.v).project(camera);
        const on = p >= a.a && p < a.b + 0.06 && lv.z < 1;
        el.classList.toggle('is-on', on);
        el.style.transform = `translate3d(${((lv.x * 0.5 + 0.5) * W).toFixed(1)}px, ${((-lv.y * 0.5 + 0.5) * H).toFixed(1)}px, 0)`;
      }
      return pinA > 0.02 || dust.alive > 0;
    },
    hud(p) {
      const pose = poseAt(p);
      const climbM = Math.max(0, (pose.y ?? 0) - ctrl[1][2]);
      const hours = sstep(0.76, 0.92, p) * 8;
      return {
        travel: `${(pose.s * LEN).toFixed(0)} m`,
        climb: `${climbM.toFixed(0)} m`,
        hours: p > 0.93 ? 'Signed off' : p > 0.74 ? `${hours.toFixed(1)} h` : '—',
        terms: p > 0.31 ? 'In the quote' : 'Pending',
      };
    },
    dispose,
  };
};
