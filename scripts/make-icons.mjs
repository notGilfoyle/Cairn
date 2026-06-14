// Generates simple solid-accent PNG app icons with no external deps.
// Run: node scripts/make-icons.mjs  (re-run if the accent changes).
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";

const ACCENT = [99, 102, 241]; // indigo-500
const STONE = [255, 255, 255];

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (~c) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function makePng(size) {
  const cx = size / 2;
  // a few stacked "stones" as horizontal bands, narrowing upward
  const stones = [
    { cy: 0.74, rx: 0.30, ry: 0.10 },
    { cy: 0.55, rx: 0.22, ry: 0.085 },
    { cy: 0.39, rx: 0.155, ry: 0.07 },
    { cy: 0.26, rx: 0.10, ry: 0.05 },
  ];
  const raw = Buffer.alloc((size * 4 + 1) * size);
  let p = 0;
  for (let y = 0; y < size; y++) {
    raw[p++] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      let col = ACCENT;
      for (const s of stones) {
        const dx = (x - cx) / (s.rx * size);
        const dy = (y - s.cy * size) / (s.ry * size);
        if (dx * dx + dy * dy <= 1) {
          col = STONE;
          break;
        }
      }
      raw[p++] = col[0];
      raw[p++] = col[1];
      raw[p++] = col[2];
      raw[p++] = 255;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

mkdirSync("public", { recursive: true });
for (const size of [192, 512]) {
  writeFileSync(`public/icon-${size}.png`, makePng(size));
  console.log(`wrote public/icon-${size}.png`);
}
