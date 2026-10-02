/**
 * Kumaon Service Area — a geographic deployment model of the region.
 *
 * Terrain is real: SRTM-derived elevation (AWS Terrarium tiles), district
 * boundaries from the Census of India 2011 polygons and rivers derived from the
 * same DEM — baked by scripts/geo/build-kumaon.mjs into public/geo/. Town
 * positions, altitudes and districts come from src/data/geo.ts. Corridors are
 * least-cost paths over the terrain: indicative, not road alignments.
 *
 * Units: 1 = 1 km. North = −Z. Vertical scale exaggerated ×VEX for legibility.
 */
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  FogExp2,
  Group,
  LinearFilter,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  RingGeometry,
  ShaderMaterial,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  Vector3,
} from 'three';
import { clamp, createRenderer, lerp, makeLights, makeRidges, makeSky, orbit, sstep, track, yieldToMain } from '../three/kit';
import { places } from '../../data/geo';
import type { Factory } from '../stage/runtime';

const BBOX = { lon0: 78.85, lon1: 80.25, lat0: 28.8, lat1: 30.0 };
const GW = 448, GH = 384;
const KX = 96.9, KZ = 110.9; // km per degree at ~29.4°N
const WKM = (BBOX.lon1 - BBOX.lon0) * KX, HKM = (BBOX.lat1 - BBOX.lat0) * KZ;
export const VEX = 2.2;
const toX = (lon: number) => (lon - BBOX.lon0) * KX - WKM / 2;
const toZ = (lat: number) => (BBOX.lat1 - lat) * KZ - HKM / 2;

const P = Object.fromEntries(places.map((p) => [p.slug, p]));
/** Which corridors light up in each chapter (by destination). */
const GROUP: Record<string, number> = {
  kathgodam: 1, pantnagar: 2, rudrapur: 2, kashipur: 2,
  bhimtal: 3, nainital: 3, bhowali: 3, ramgarh: 3, mukteshwar: 3,
  ranikhet: 4, almora: 4, bageshwar: 4, berinag: 4, haldwani: 0,
};

/* camera: [p, az, el, distKm, lon, lat] */
const camKeys = [
  [0.0, 96, 14, 26, 79.51, 29.27],
  [0.13, 100, 18, 30, 79.51, 29.29],
  [0.2, 94, 46, 118, 79.6, 29.42],
  [0.33, 104, 50, 125, 79.62, 29.42],
  [0.4, 58, 30, 52, 79.42, 29.08],
  [0.5, 70, 32, 50, 79.42, 29.1],
  [0.57, 118, 30, 34, 79.55, 29.38],
  [0.67, 132, 34, 32, 79.56, 29.4],
  [0.74, 112, 30, 56, 79.6, 29.62],
  [0.81, 138, 34, 62, 79.85, 29.72],
  [0.87, 150, 36, 64, 79.88, 29.72],
  [0.93, 98, 44, 140, 79.58, 29.4],
  [1.0, 92, 46, 146, 79.58, 29.4],
];
const focusFor = (p: number) => (p < 0.17 ? 0 : p < 0.36 ? -1 : p < 0.53 ? 2 : p < 0.7 ? 3 : p < 0.9 ? 4 : -1);

export const create: Factory = async (canvas, ctx) => {
  const [demBuf, routes, mask] = await Promise.all([
    fetch('/geo/kumaon-dem.bin').then((r) => { if (!r.ok) throw new Error('dem'); return r.arrayBuffer(); }),
    fetch('/geo/kumaon-routes.json').then((r) => r.json() as Promise<{ routes: { a: string; b: string; pts: [number, number][] }[] }>),
    new TextureLoader().loadAsync('/geo/kumaon-mask.png'),
  ]);
  const dem = new Uint16Array(demBuf);
  const elev = (lon: number, lat: number) => {
    const fx = clamp((lon - BBOX.lon0) / (BBOX.lon1 - BBOX.lon0)) * (GW - 1), fy = clamp((BBOX.lat1 - lat) / (BBOX.lat1 - BBOX.lat0)) * (GH - 1);
    const x = Math.min(GW - 2, Math.floor(fx)), y = Math.min(GH - 2, Math.floor(fy)), u = fx - x, v = fy - y;
    const g = (i: number, j: number) => dem[j * GW + i];
    return lerp(lerp(g(x, y), g(x + 1, y), u), lerp(g(x, y + 1), g(x + 1, y + 1), u), v);
  };
  const yAt = (lon: number, lat: number) => (elev(lon, lat) / 1000) * VEX;

  const { renderer, scene, dispose } = createRenderer(canvas, ctx, { envIntensity: 0.18 });
  renderer.toneMappingExposure = 1.08;
  const camera = new PerspectiveCamera(ctx.mobile ? 48 : 36, 1, 0.2, 4000);
  const haze = new Color('#5d6a74');
  scene.background = haze;
  scene.fog = new FogExp2(haze, 0.0042);
  const sky = makeSky({ top: '#1f2a33', horizon: '#76828b', glow: '#e0a874', sunDir: new Vector3(-0.6, 0.25, 0.7) });
  scene.add(sky.mesh);
  // the Greater Himalaya stand beyond the northern edge of Kumaon
  const him = makeRidges({ seed: 21, layers: [
    { z: 0, base: 4, amp: 18, col: '#4a5862', freq: 0.02 },
    { z: -60, base: 8, amp: 30, col: '#6b7883', freq: 0.016, snow: false },
    { z: -140, base: 14, amp: 34, col: '#8b98a2', freq: 0.012, snow: false },
  ] });
  him.grp.scale.set(0.35, 0.55, 1);
  him.grp.position.set(0, -2, -HKM / 2 - 40);
  scene.add(him.grp);
  const snow = makeRidges({ seed: 5, layers: [{ z: 0, base: 20, amp: 40, col: '#c8d0d6', freq: 0.03 }] });
  snow.grp.scale.set(0.3, 0.42, 1);
  snow.grp.position.set(20, 0, -HKM / 2 - 230);
  scene.add(snow.grp);
  const L = makeLights(scene, ctx, { sun: '#ffd9b0', sunI: 3.4, hemiI: 0.45, sky: '#b9c6d2', ground: '#2c2a24', extent: 80, far: 400 });
  L.sun.shadow.bias = -0.0006;
  L.sun.shadow.normalBias = 0.4;
  L.follow(0, 0, 0, new Vector3(-90, 70, 110));
  await yieldToMain();

  /* ---------------- terrain ---------------- */
  const stride = ctx.lite ? 2 : 1;
  const cols = Math.floor((GW - 1) / stride) + 1, rows = Math.floor((GH - 1) / stride) + 1;
  const geo = new PlaneGeometry(WKM, HKM, cols - 1, rows - 1);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position as BufferAttribute;
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const gi = Math.min(GW - 1, i * stride), gj = Math.min(GH - 1, j * stride);
    pos.setY(j * cols + i, (dem[gj * GW + gi] / 1000) * VEX);
  }
  geo.computeVertexNormals();
  mask.colorSpace = '' as Texture['colorSpace'];
  mask.minFilter = LinearFilter;
  mask.generateMipmaps = false;
  const uFocus = { value: new Vector3(0, 0, -1) };
  const tmat = new MeshStandardMaterial({ color: '#ffffff', roughness: 0.95, metalness: 0 });
  tmat.onBeforeCompile = (sh) => {
    sh.uniforms.uMask = { value: mask };
    sh.uniforms.uFocus = uFocus;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vTW; varying vec2 vTU; varying vec3 vTN;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvTW = (modelMatrix * vec4(transformed,1.0)).xyz; vTU = uv; vTN = normal;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vTW; varying vec2 vTU; varying vec3 vTN; uniform sampler2D uMask; uniform vec3 uFocus;
        float th(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
        float tn(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.0-2.0*f); return mix(mix(th(i), th(i+vec2(1,0)), u.x), mix(th(i+vec2(0,1)), th(i+vec2(1,1)), u.x), u.y); }
        float tf(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * tn(p); p *= 2.1; a *= 0.5; } return s; }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        float hm = vTW.y / ${VEX.toFixed(2)} * 1000.0;
        float slope = 1.0 - normalize(vTN).y;
        vec4 mk = texture2D(uMask, vTU);
        float n = tf(vTW.xz * 0.9), n2 = tn(vTW.xz * 6.0);
        // farmland mosaic on the plains, forest belts in the hills, rock on steep faces
        vec2 fc = floor(vTW.xz * 2.4 + n * 2.0);
        float field = th(fc);
        vec3 plains = mix(vec3(0.36, 0.37, 0.24), vec3(0.47, 0.43, 0.29), field) * (0.9 + n2 * 0.18);
        vec3 bhabar = vec3(0.24, 0.29, 0.19);
        vec3 forest = mix(vec3(0.15, 0.21, 0.14), vec3(0.22, 0.27, 0.17), n);
        vec3 upper = mix(vec3(0.27, 0.31, 0.23), vec3(0.34, 0.35, 0.29), n);
        vec3 rock = mix(vec3(0.42, 0.4, 0.36), vec3(0.5, 0.47, 0.42), n2);
        vec3 c = mix(plains, bhabar, smoothstep(330.0, 520.0, hm));
        c = mix(c, forest, smoothstep(500.0, 800.0, hm));
        c = mix(c, upper, smoothstep(1700.0, 2400.0, hm) * 0.8);
        c = mix(c, rock, smoothstep(0.42, 0.68, slope) * smoothstep(400.0, 900.0, hm) * 0.75);
        // terraced slopes catch light: sunny south aspects slightly warmer
        c *= 0.92 + n2 * 0.16;
        // rivers: keep the main channels in the plains, all channels in the hills
        float riv = mk.r * mix(smoothstep(0.55, 0.9, mk.r), 1.0, smoothstep(350.0, 600.0, hm));
        c = mix(c, vec3(0.36, 0.47, 0.53), clamp(riv * 1.1, 0.0, 0.85));
        // contours every 200 m
        float ce = hm / 200.0; float cw = fwidth(ce);
        float cl = 1.0 - smoothstep(0.0, cw * 1.2, abs(fract(ce + 0.5) - 0.5));
        c = mix(c, c * 1.35 + 0.03, cl * 0.22 * smoothstep(250.0, 400.0, hm));
        // outside Kumaon: recede
        float inside = smoothstep(0.3, 0.7, mk.b);
        c = mix(c * vec3(0.55, 0.57, 0.6), c, 0.25 + inside * 0.75);
        // district boundaries
        c = mix(c, vec3(0.86, 0.8, 0.7), mk.g * 0.55);
        // focus pool of light around the active area
        float fd = length(vTW.xz - uFocus.xy);
        c *= 1.0 + 0.16 * (1.0 - smoothstep(uFocus.z * 0.4, uFocus.z, fd)) * step(0.0, uFocus.z);
        diffuseColor.rgb = c;`);
  };
  tmat.customProgramCacheKey = () => 'kumaonTerrain';
  const terrain = new Mesh(geo, tmat);
  terrain.receiveShadow = true;
  terrain.castShadow = true;
  scene.add(terrain);
  // a skirt so the model reads as a cut block of land, not an infinite plane
  const skirt = new Mesh(new PlaneGeometry(WKM * 4, HKM * 4), new MeshStandardMaterial({ color: '#2b3034', roughness: 1 }));
  skirt.rotation.x = -Math.PI / 2;
  skirt.position.y = 0.1;
  skirt.receiveShadow = true;
  scene.add(skirt);
  await yieldToMain();

  /* ---------------- corridors ---------------- */
  const routeMat = (col: string) => new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -6,
    polygonOffsetUnits: -6,
    uniforms: { uDraw: { value: 0 }, uTime: { value: 0 }, uColor: { value: new Color(col) }, uAlpha: { value: 1 } },
    vertexShader: `attribute float aU; attribute float aS; varying float vU; varying float vS; void main(){ vU = aU; vS = aS; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `varying float vU; varying float vS; uniform float uDraw; uniform float uTime; uniform vec3 uColor; uniform float uAlpha;
      void main(){
        if (vU > uDraw) discard;
        float core = 1.0 - smoothstep(0.15, 1.0, abs(vS));
        float pulse = smoothstep(0.92, 1.0, fract(vU * 3.0 - uTime * 0.35));
        float head = smoothstep(uDraw - 0.04, uDraw, vU) * step(vU, uDraw) * (1.0 - step(0.999, uDraw));
        vec3 c = uColor * (0.75 + pulse * 0.9 + head * 1.4);
        gl_FragColor = vec4(c, (0.35 + core * 0.65) * uAlpha);
        #include <colorspace_fragment>
      }`,
  });
  const routeObjs = routes.routes.map((r) => {
    const pts = r.pts.map(([lon, lat]) => new Vector3(toX(lon), yAt(lon, lat) + 0.14, toZ(lat)));
    // densify so the ribbon hugs the terrain
    const dense: Vector3[] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], n = Math.max(1, Math.ceil(a.distanceTo(b) / 0.18));
      for (let k = 0; k < n; k++) {
        const v = a.clone().lerp(b, k / n);
        const lon = BBOX.lon0 + (v.x + WKM / 2) / KX, lat = BBOX.lat1 - (v.z + HKM / 2) / KZ;
        // sit above the highest of the surrounding DEM cells
        const e = 0.004;
        v.y = Math.max(yAt(lon, lat), yAt(lon + e, lat), yAt(lon - e, lat), yAt(lon, lat + e), yAt(lon, lat - e)) + 0.12;
        dense.push(v);
      }
    }
    dense.push(pts[pts.length - 1]);
    const W = 0.2;
    const posA: number[] = [], uA: number[] = [], sA: number[] = [], idx: number[] = [];
    let len = 0;
    const lens = [0];
    for (let i = 1; i < dense.length; i++) lens.push((len += dense[i].distanceTo(dense[i - 1])));
    dense.forEach((p, i) => {
      const a = dense[Math.max(0, i - 1)], b = dense[Math.min(dense.length - 1, i + 1)];
      const dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1;
      for (const s of [-1, 1]) { posA.push(p.x - (dz / l) * s * W, p.y, p.z + (dx / l) * s * W); uA.push(lens[i] / len); sA.push(s); }
      if (i < dense.length - 1) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    });
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(posA, 3));
    g.setAttribute('aU', new Float32BufferAttribute(uA, 1));
    g.setAttribute('aS', new Float32BufferAttribute(sA, 1));
    g.setIndex(idx);
    const m = routeMat('#e08a4f');
    const mesh = new Mesh(g, m);
    mesh.renderOrder = 3;
    scene.add(mesh);
    return { r, mat: m, group: GROUP[r.b] ?? 1 };
  });

  /* ---------------- town markers ---------------- */
  const beamG = new CylinderGeometry(0.06, 0.06, 1, 8, 1, true);
  beamG.translate(0, 0.5, 0);
  const beamMat = (c: string) => new ShaderMaterial({
    transparent: true, depthWrite: false, blending: AdditiveBlending,
    uniforms: { uColor: { value: new Color(c) }, uA: { value: 1 } },
    vertexShader: 'varying float vY; void main(){ vY = position.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'varying float vY; uniform vec3 uColor; uniform float uA; void main(){ gl_FragColor = vec4(uColor * (1.0 - vY) * 1.6, (1.0 - vY) * uA); }',
  });
  const ringMat = (c: string) => new ShaderMaterial({
    transparent: true, depthWrite: false, blending: AdditiveBlending, side: DoubleSide,
    uniforms: { uColor: { value: new Color(c) }, uA: { value: 1 }, uT: { value: 0 } },
    vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `varying vec2 vP; uniform vec3 uColor; uniform float uA; uniform float uT;
      void main(){ float r = length(vP); float ring = smoothstep(0.05, 0.0, abs(r - fract(uT) * 1.0)) * (1.0 - fract(uT)); float dot = smoothstep(0.24, 0.16, r);
        gl_FragColor = vec4(uColor, (ring * 0.8 + dot) * uA); }`,
  });
  const markers = places.map((p) => {
    const base = p.slug === 'haldwani';
    const g = new Group();
    const y = yAt(p.lon, p.lat);
    g.position.set(toX(p.lon), y, toZ(p.lat));
    const bm = beamMat(base ? '#f0a066' : '#e8dccb');
    const beam = new Mesh(beamG, bm);
    beam.scale.set(base ? 1.6 : 1, base ? 4.2 : 2.6, base ? 1.6 : 1);
    const rm = ringMat(base ? '#e08a4f' : '#e8dccb');
    const ring = new Mesh(new RingGeometry(0, base ? 2.6 : 1.5, 48), rm);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.12;
    g.add(beam, ring);
    g.renderOrder = 4;
    scene.add(g);
    return { p, g, bm, rm, top: new Vector3(g.position.x, y + beam.scale.y, g.position.z), base };
  });

  /* ---------------- labels (HTML, projected) ---------------- */
  const labelEls = new Map<string, HTMLElement>();
  ctx.root.querySelectorAll<HTMLElement>('[data-label]').forEach((el) => labelEls.set(el.dataset.label!, el));
  const v = new Vector3();
  let W = 1, H = 1;

  try { await renderer.compileAsync(scene, camera); } catch { /* first frame */ }
  const tmp = new Vector3();
  let t = 0;

  const groupDraw = (p: number, g: number) => {
    if (g === 0) return 1;
    // network reveal in chapter 1, everything stays drawn after
    return sstep(0.18 + (g - 1) * 0.035, 0.27 + (g - 1) * 0.035, p);
  };

  return {
    resize(w, h) {
      W = w; H = h;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      if (ctx.capture) camera.clearViewOffset();
      else if (ctx.mobile) camera.setViewOffset(w, h, 0, h * 0.18, w, h);
      else camera.setViewOffset(w, h, -w * 0.15, 0, w, h);
      camera.updateProjectionMatrix();
    },
    render(p, dt) {
      t += dt;
      const [az, el, dist, lon, lat] = track(camKeys, p);
      const tx = toX(lon), tz = toZ(lat), ty = yAt(lon, lat);
      orbit(camera, [az, el, ctx.mobile ? dist * 1.3 : dist, tx, ty, tz], tmp);
      camera.updateMatrixWorld();
      const focus = focusFor(p);
      // focus pool follows the camera target
      uFocus.value.set(tx, tz, focus === -1 ? -1 : dist * 0.55);

      for (const r of routeObjs) {
        r.mat.uniforms.uDraw.value = groupDraw(p, r.group);
        r.mat.uniforms.uTime.value = t;
        const on = focus <= 0 || r.group === focus || (focus === 3 && r.group === 1);
        r.mat.uniforms.uAlpha.value += ((on ? 1 : 0.32) - r.mat.uniforms.uAlpha.value) * Math.min(1, dt * 4 + (dt === 0 ? 1 : 0));
      }

      // markers + labels
      const occupied: [number, number, number, number][] = [];
      const order = [...markers].sort((a, b) => (b.base ? 9 : (GROUP[b.p.slug] === focus ? 5 : 0)) - (a.base ? 9 : (GROUP[a.p.slug] === focus ? 5 : 0)));
      for (const m of order) {
        const grp = GROUP[m.p.slug];
        const reveal = m.base ? 1 : groupDraw(p, grp === 0 ? 1 : grp);
        const hot = m.base || grp === focus || focus === -1;
        const a = reveal * (hot ? 1 : 0.35);
        m.bm.uniforms.uA.value = a;
        m.rm.uniforms.uA.value = a;
        m.rm.uniforms.uT.value = t * (m.base ? 0.45 : 0.3) + grp * 0.17;
        const el = labelEls.get(m.p.slug);
        if (!el) continue;
        v.copy(m.top).project(camera);
        const sx = (v.x * 0.5 + 0.5) * W, sy = (-v.y * 0.5 + 0.5) * H;
        let show = v.z < 1 && sx > -40 && sx < W + 40 && sy > 40 && sy < H - 20 && reveal > 0.5 && (hot || p > 0.9);
        const bw = (el.dataset.w ? Number(el.dataset.w) : 90), bh = 34;
        if (show) {
          for (const [x0, y0, x1, y1] of occupied) if (sx < x1 && sx + bw > x0 && sy - bh < y1 && sy > y0) { show = m.base || false; break; }
        }
        if (show) occupied.push([sx, sy - bh, sx + bw, sy]);
        el.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0)`;
        el.classList.toggle('is-on', show);
        el.classList.toggle('is-hot', show && hot && focus !== -1);
      }
      renderer.render(scene, camera);
      return !ctx.lite; // corridors pulse and rings breathe while visible (not on low-power devices)
    },
    dispose,
  };
};

