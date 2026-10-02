/**
 * Bakes the geographic data behind the Kumaon service-area terrain.
 *
 *   node scripts/geo/build-kumaon.mjs [path/to/2011_Dist]   (needs network for DEM tiles)
 *
 * Sources
 *  - Elevation: Mapzen/Tilezen "Terrarium" tiles on AWS Open Data
 *    (s3.amazonaws.com/elevation-tiles-prod, SRTM-derived, ~75 m at z11).
 *  - District boundaries: Census of India 2011 district polygons
 *    (github.com/datameet/maps, Districts/Census_2011/2011_Dist.*) — the six
 *    districts of the Kumaon division.
 *  - Rivers: derived from the same DEM (priority-flood + D8 flow accumulation).
 *  - Routes: least-cost paths over the DEM between the towns we serve. These are
 *    INDICATIVE deployment corridors, not road alignments, and are labelled so.
 *
 * Outputs (public/geo/)
 *  - kumaon-dem.bin   Uint16 LE, W×H, metres above sea level, row 0 = north
 *  - kumaon-mask.png  RGB: R rivers, G district boundaries, B inside Kumaon
 *  - kumaon-routes.json
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const OUT = path.resolve('public/geo');
const SHP = process.argv[2] ?? '/tmp/claude-0/geo/2011_Dist';
export const BBOX = { lon0: 78.85, lon1: 80.25, lat0: 28.8, lat1: 30.0 };
const Z = 11;
const W = 448, H = 384; // output DEM grid
const HW = 1400, HH = 1200; // hydrology grid (~100 m)
const MW = 1024, MH = 878; // mask texture

/* ---------------- PNG ---------------- */
function pngDecode(buf) {
  let o = 8, w = 0, h = 0, ct = 0, bd = 0;
  const idat = [];
  while (o < buf.length) {
    const len = buf.readUInt32BE(o), type = buf.toString('ascii', o + 4, o + 8);
    const d = buf.subarray(o + 8, o + 8 + len);
    if (type === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); bd = d[8]; ct = d[9]; }
    else if (type === 'IDAT') idat.push(d);
    o += 12 + len;
  }
  if (bd !== 8 || (ct !== 2 && ct !== 6)) throw new Error(`unsupported png ct=${ct} bd=${bd}`);
  const bpp = ct === 2 ? 3 : 4;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = w * bpp, out = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], src = y * (stride + 1) + 1, dst = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? out[dst + x - bpp] : 0, b = y ? out[dst - stride + x] : 0, c = x >= bpp && y ? out[dst - stride + x - bpp] : 0;
      let v = raw[src + x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      out[dst + x] = v & 255;
    }
  }
  return { w, h, bpp, data: out };
}
function crc32(b) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < b.length; n++) { c = (crc ^ b[n]) & 255; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crc = (crc >>> 8) ^ c; }
  return (crc ^ 0xffffffff) >>> 0;
}
function pngEncode(w, h, rgb) {
  const raw = Buffer.alloc(h * (w * 3 + 1));
  for (let y = 0; y < h; y++) rgb.copy(raw, y * (w * 3 + 1) + 1, y * w * 3, (y + 1) * w * 3);
  const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc32(td)); return Buffer.concat([l, td, c]); };
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

/* ---------------- DEM tiles ---------------- */
const tx = (lon) => ((lon + 180) / 360) * 2 ** Z;
const ty = (lat) => ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) * 2 ** Z;
const tiles = new Map();
async function loadTiles() {
  const x0 = Math.floor(tx(BBOX.lon0)), x1 = Math.floor(tx(BBOX.lon1)), y0 = Math.floor(ty(BBOX.lat1)), y1 = Math.floor(ty(BBOX.lat0));
  const cache = '/tmp/claude-0/geo/tiles';
  fs.mkdirSync(cache, { recursive: true });
  const jobs = [];
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) jobs.push([x, y]);
  console.log(`DEM: ${jobs.length} tiles at z${Z}`);
  for (let i = 0; i < jobs.length; i += 8) {
    await Promise.all(jobs.slice(i, i + 8).map(async ([x, y]) => {
      const f = `${cache}/${Z}-${x}-${y}.png`;
      if (!fs.existsSync(f)) {
        const r = await fetch(`https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${Z}/${x}/${y}.png`);
        if (!r.ok) throw new Error(`tile ${x},${y}: ${r.status}`);
        fs.writeFileSync(f, Buffer.from(await r.arrayBuffer()));
      }
      const p = pngDecode(fs.readFileSync(f));
      const e = new Float32Array(256 * 256);
      for (let k = 0; k < e.length; k++) e[k] = p.data[k * p.bpp] * 256 + p.data[k * p.bpp + 1] + p.data[k * p.bpp + 2] / 256 - 32768;
      tiles.set(`${x},${y}`, e);
    }));
  }
}
function elevAt(lon, lat) {
  const fx = tx(lon), fy = ty(lat);
  const px = fx * 256 - 0.5, py = fy * 256 - 0.5;
  const ix = Math.floor(px), iy = Math.floor(py), u = px - ix, v = py - iy;
  const g = (X, Y) => { const t = tiles.get(`${Math.floor(X / 256)},${Math.floor(Y / 256)}`); return t ? t[(Y & 255) * 256 + (X & 255)] : 0; };
  return (g(ix, iy) * (1 - u) + g(ix + 1, iy) * u) * (1 - v) + (g(ix, iy + 1) * (1 - u) + g(ix + 1, iy + 1) * u) * v;
}
function grid(w, h) {
  const a = new Float32Array(w * h);
  for (let j = 0; j < h; j++) {
    const lat = BBOX.lat1 - ((BBOX.lat1 - BBOX.lat0) * j) / (h - 1);
    for (let i = 0; i < w; i++) a[j * w + i] = Math.max(0, elevAt(BBOX.lon0 + ((BBOX.lon1 - BBOX.lon0) * i) / (w - 1), lat));
  }
  return a;
}

/* ---------------- Hydrology ---------------- */
class Heap {
  constructor() { this.k = []; this.v = []; }
  push(key, val) { const k = this.k, v = this.v; let i = k.length; k.push(key); v.push(val); while (i) { const p = (i - 1) >> 1; if (k[p] <= key) break; k[i] = k[p]; v[i] = v[p]; i = p; } k[i] = key; v[i] = val; }
  pop() { const k = this.k, v = this.v, top = v[0], lk = k.pop(), lv = v.pop(); if (k.length) { let i = 0; const n = k.length; for (;;) { let c = 2 * i + 1; if (c >= n) break; if (c + 1 < n && k[c + 1] < k[c]) c++; if (k[c] >= lk) break; k[i] = k[c]; v[i] = v[c]; i = c; } k[i] = lk; v[i] = lv; } return top; }
  get size() { return this.k.length; }
}
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];
function rivers(dem, w, h) {
  // priority-flood fill (with a tiny epsilon so flats drain)
  const z = Float32Array.from(dem), done = new Uint8Array(w * h), hp = new Heap();
  for (let i = 0; i < w; i++) for (const j of [0, h - 1]) { done[j * w + i] = 1; hp.push(z[j * w + i], j * w + i); }
  for (let j = 1; j < h - 1; j++) for (const i of [0, w - 1]) { done[j * w + i] = 1; hp.push(z[j * w + i], j * w + i); }
  while (hp.size) {
    const c = hp.pop(), cx = c % w, cy = (c / w) | 0;
    for (const [dx, dy] of NB) {
      const x = cx + dx, y = cy + dy;
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      const n = y * w + x;
      if (done[n]) continue;
      done[n] = 1;
      if (z[n] <= z[c]) z[n] = z[c] + 1e-3;
      hp.push(z[n], n);
    }
  }
  // D8 receivers, accumulate from high to low
  const rec = new Int32Array(w * h).fill(-1);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const c = y * w + x; let best = 0, bn = -1;
    for (const [dx, dy] of NB) { const n = (y + dy) * w + x + dx; const s = (z[c] - z[n]) / Math.hypot(dx, dy); if (s > best) { best = s; bn = n; } }
    rec[c] = bn;
  }
  const order = Array.from({ length: w * h }, (_, i) => i).sort((a, b) => z[b] - z[a]);
  const acc = new Float32Array(w * h).fill(1);
  for (const c of order) if (rec[c] >= 0) acc[rec[c]] += acc[c];
  return { acc, rec };
}

/* ---------------- Shapefile ---------------- */
function readPolys(base, wanted) {
  const b = fs.readFileSync(`${base}.shp`), d = fs.readFileSync(`${base}.dbf`);
  const n = d.readUInt32LE(4), hl = d.readUInt16LE(8), rl = d.readUInt16LE(10);
  const names = [];
  for (let i = 0; i < n; i++) names.push(d.toString('latin1', hl + i * rl + 1, hl + i * rl + 29).trim());
  const out = [];
  let o = 100, idx = 0;
  while (o < b.length) {
    const len = b.readUInt32BE(o + 4) * 2, r = o + 8, type = b.readInt32LE(r);
    if ((type === 5 || type === 15) && wanted.includes(names[idx])) {
      const np = b.readInt32LE(r + 36), nv = b.readInt32LE(r + 40), parts = [];
      for (let k = 0; k < np; k++) parts.push(b.readInt32LE(r + 44 + k * 4));
      parts.push(nv);
      const pts = r + 44 + np * 4, rings = [];
      for (let k = 0; k < np; k++) { const ring = []; for (let v = parts[k]; v < parts[k + 1]; v++) ring.push([b.readDoubleLE(pts + v * 16), b.readDoubleLE(pts + v * 16 + 8)]); rings.push(ring); }
      out.push({ name: names[idx], rings });
    }
    o = r + len; idx++;
  }
  return out;
}

/* ---------------- Least-cost routes ---------------- */
const geo = JSON.parse(fs.readFileSync(new URL('./places.json', import.meta.url)));
function route(dem, a, b) {
  const kx = ((BBOX.lon1 - BBOX.lon0) / (W - 1)) * 96.9e3, ky = ((BBOX.lat1 - BBOX.lat0) / (H - 1)) * 110.9e3;
  const gi = (lon, lat) => [Math.round(((lon - BBOX.lon0) / (BBOX.lon1 - BBOX.lon0)) * (W - 1)), Math.round(((BBOX.lat1 - lat) / (BBOX.lat1 - BBOX.lat0)) * (H - 1))];
  const [sx, sy] = gi(a.lon, a.lat), [ex, ey] = gi(b.lon, b.lat);
  const dist = new Float64Array(W * H).fill(Infinity), prev = new Int32Array(W * H).fill(-1), hp = new Heap();
  const s = sy * W + sx, e = ey * W + ex;
  dist[s] = 0; hp.push(0, s);
  while (hp.size) {
    const c = hp.pop(); if (c === e) break;
    const cx = c % W, cy = (c / W) | 0;
    for (const [dx, dy] of NB) {
      const x = cx + dx, y = cy + dy; if (x < 0 || y < 0 || x >= W || y >= H) continue;
      const n = y * W + x, run = Math.hypot(dx * kx, dy * ky), slope = Math.abs(dem[n] - dem[c]) / run;
      // roads hold gentle grades: cost rises steeply above ~8 %
      const cost = run * (1 + 900 * slope * slope + (slope > 0.14 ? 40 : 0));
      if (dist[c] + cost < dist[n]) { dist[n] = dist[c] + cost; prev[n] = c; hp.push(dist[n], n); }
    }
  }
  let pts = [];
  for (let c = e; c >= 0; c = prev[c]) pts.push([c % W, (c / W) | 0]);
  pts.reverse();
  // simplify (RDP) then smooth (Chaikin ×2)
  const rdp = (p, eps) => { if (p.length < 3) return p; let md = 0, mi = 0; const [x1, y1] = p[0], [x2, y2] = p[p.length - 1], L = Math.hypot(x2 - x1, y2 - y1) || 1; for (let i = 1; i < p.length - 1; i++) { const d = Math.abs((x2 - x1) * (y1 - p[i][1]) - (x1 - p[i][0]) * (y2 - y1)) / L; if (d > md) { md = d; mi = i; } } return md > eps ? [...rdp(p.slice(0, mi + 1), eps).slice(0, -1), ...rdp(p.slice(mi), eps)] : [p[0], p[p.length - 1]]; };
  pts = rdp(pts, 0.6);
  for (let k = 0; k < 2; k++) { const q = [pts[0]]; for (let i = 0; i < pts.length - 1; i++) { const [a0, a1] = pts[i], [b0, b1] = pts[i + 1]; q.push([a0 * 0.75 + b0 * 0.25, a1 * 0.75 + b1 * 0.25], [a0 * 0.25 + b0 * 0.75, a1 * 0.25 + b1 * 0.75]); } q.push(pts[pts.length - 1]); pts = q; }
  return pts.map(([x, y]) => [+(BBOX.lon0 + (x / (W - 1)) * (BBOX.lon1 - BBOX.lon0)).toFixed(4), +(BBOX.lat1 - (y / (H - 1)) * (BBOX.lat1 - BBOX.lat0)).toFixed(4)]);
}

/* ---------------- Main ---------------- */
await loadTiles();
fs.mkdirSync(OUT, { recursive: true });

const dem = grid(W, H);
const u16 = new Uint16Array(W * H);
for (let i = 0; i < u16.length; i++) u16[i] = Math.round(dem[i]);
fs.writeFileSync(`${OUT}/kumaon-dem.bin`, Buffer.from(u16.buffer));
let mn = Infinity, mx = 0; for (const v of dem) { mn = Math.min(mn, v); mx = Math.max(mx, v); }
console.log(`DEM ${W}×${H}, ${mn.toFixed(0)}–${mx.toFixed(0)} m`);

const mask = Buffer.alloc(MW * MH * 3);
const toM = (lon, lat) => [((lon - BBOX.lon0) / (BBOX.lon1 - BBOX.lon0)) * MW, ((BBOX.lat1 - lat) / (BBOX.lat1 - BBOX.lat0)) * MH];
const plot = (ch, x, y, v) => { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= MW || y >= MH) return; const k = (y * MW + x) * 3 + ch; mask[k] = Math.max(mask[k], v); };
const line = (ch, x0, y0, x1, y1, r, v) => { const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2) + 1; for (let s = 0; s <= n; s++) { const x = x0 + ((x1 - x0) * s) / n, y = y0 + ((y1 - y0) * s) / n; for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) for (let dx = -Math.ceil(r); dx <= Math.ceil(r); dx++) { const d = Math.hypot(dx, dy); if (d <= r + 0.5) plot(ch, x + dx, y + dy, Math.round(v * Math.min(1, r + 0.5 - d))); } } };

// rivers
const hdem = grid(HW, HH);
const { acc, rec } = rivers(hdem, HW, HH);
const T = 900; // ≈ 9 km² catchment
let rc = 0;
for (let c = 0; c < HW * HH; c++) {
  if (acc[c] < T || rec[c] < 0) continue;
  rc++;
  const x0 = ((c % HW) / (HW - 1)) * MW, y0 = (((c / HW) | 0) / (HH - 1)) * MH, x1 = ((rec[c] % HW) / (HW - 1)) * MW, y1 = (((rec[c] / HW) | 0) / (HH - 1)) * MH;
  const strength = Math.min(1, Math.log(acc[c] / T) / Math.log(400));
  line(0, x0, y0, x1, y1, 0.4 + strength * 1.6, 90 + strength * 165);
}
console.log(`rivers: ${rc} cells`);

// districts
const kumaon = ['Nainital', 'Udham Singh Nagar', 'Almora', 'Bageshwar', 'Pithoragarh', 'Champawat'];
const polys = readPolys(SHP, kumaon);
console.log('districts:', polys.map((p) => p.name).join(', '));
for (const p of polys) for (const ring of p.rings) {
  for (let i = 0; i < ring.length - 1; i++) { const [a0, a1] = toM(...ring[i]), [b0, b1] = toM(...ring[i + 1]); line(1, a0, a1, b0, b1, 0.9, 255); }
  // even-odd scanline fill → B channel
}
for (let y = 0; y < MH; y++) {
  const lat = BBOX.lat1 - ((y + 0.5) / MH) * (BBOX.lat1 - BBOX.lat0);
  for (const p of polys) {
    const xs = [];
    for (const ring of p.rings) for (let i = 0; i < ring.length - 1; i++) { const [ax, ay] = ring[i], [bx, by] = ring[i + 1]; if ((ay > lat) !== (by > lat)) xs.push(ax + ((lat - ay) / (by - ay)) * (bx - ax)); }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) { const x0 = Math.max(0, Math.ceil(toM(xs[k], lat)[0])), x1 = Math.min(MW - 1, Math.floor(toM(xs[k + 1], lat)[0])); for (let x = x0; x <= x1; x++) mask[(y * MW + x) * 3 + 2] = 255; }
  }
}
fs.writeFileSync(`${OUT}/kumaon-mask.png`, pngEncode(MW, MH, mask));

// routes
const P = Object.fromEntries(geo.places.map((p) => [p.slug, p]));
const routes = geo.links.map(([a, b]) => ({ a, b, pts: route(dem, P[a], P[b]) }));
fs.writeFileSync(`${OUT}/kumaon-routes.json`, JSON.stringify({ note: 'Indicative least-cost corridors over SRTM terrain — not road alignments.', routes }));
console.log(`routes: ${routes.length}`);
console.log(`files: ${fs.readdirSync(OUT).map((f) => `${f} ${(fs.statSync(`${OUT}/${f}`).size / 1024).toFixed(0)}KB`).join(', ')}`);
