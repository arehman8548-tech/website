// Crops real site photos from media/originals into src/assets/media.
// Framing only: no colour, exposure or content changes. Metadata is stripped.
// Astro then generates responsive AVIF/WebP from these masters at build time.
import sharp from 'sharp';
const src = 'media/originals/';
const out = 'src/assets/media/';
const jobs = [
  // Ranikhet–Majkhali resort development
  ['IMG_20191207_171042.jpg', 'resort-himalaya-portrait.jpg', { left: 0, top: 1000, width: 2400, height: 3000 }],
  ['IMG-20200131-WA0004.jpg', 'resort-snow.jpg', { left: 0, top: 0, width: 960, height: 1200 }],
  // Padampuri road widening
  ['IMG_20211011_130603.jpg', 'padampuri-backhoe-working.jpg', { left: 0, top: 0, width: 4000, height: 2667 }],
  ['IMG_20211011_131014.jpg', 'padampuri-stabilisers.jpg', { left: 180, top: 0, width: 2400, height: 3000 }],
  ['IMG-20220427-WA0004.jpg', 'padampuri-machine-front.jpg', { left: 0, top: 20, width: 1052, height: 701 }],
  ['IMG_20220608_132034.jpg', 'padampuri-retaining-wall.jpg', { left: 0, top: 0, width: 4000, height: 2667 }],
];
for (const [i, o, c] of jobs) {
  const img = sharp(src + i).rotate().extract(c);
  const w = Math.min(c.width, 2400);
  await img.resize({ width: w }).jpeg({ quality: 90, mozjpeg: true }).toFile(out + o);
  console.log(o, c.width + 'x' + c.height, '→', w);
}
