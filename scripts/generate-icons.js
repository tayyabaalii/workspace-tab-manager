// Generate PNG icons for the Chrome extension.
// Run: node scripts/generate-icons.js

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function insideRoundRect(x, y, w, h, r) {
  if (x < 0 || y < 0 || x >= w || y >= h) return false;
  r = Math.min(r, Math.floor(w / 2), Math.floor(h / 2));
  if (r <= 0) return true;

  const corners = [
    [r, r],
    [w - r - 1, r],
    [r, h - r - 1],
    [w - r - 1, h - r - 1],
  ];

  if (x >= r && x < w - r) return true;
  if (y >= r && y < h - r) return true;

  for (const [cx, cy] of corners) {
    const inCorner =
      (cx === r && x < r && y < r) ||
      (cx === w - r - 1 && x >= w - r && y < r) ||
      (cx === r && x < r && y >= h - r) ||
      (cx === w - r - 1 && x >= w - r && y >= h - r);

    if (inCorner && (x - cx) ** 2 + (y - cy) ** 2 <= r ** 2) return true;
  }

  return false;
}

function createPng(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const gap = Math.max(1, Math.round(size * 0.1));
  const cell = (size - gap) / 2;
  const outerR = Math.max(1, Math.round(size * 0.18));
  const innerR = Math.max(0, Math.round(size * 0.1));

  const bgA = [99, 102, 241];
  const bgB = [67, 56, 202];
  const tile = [255, 255, 255];

  const cells = [
    { x: 0, y: 0 },
    { x: cell + gap, y: 0 },
    { x: 0, y: cell + gap },
    { x: cell + gap, y: cell + gap },
  ];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;

      if (!insideRoundRect(x, y, size, size, outerR)) {
        pixels[i + 3] = 0;
        continue;
      }

      let color = [
        Math.round(bgA[0] + (bgB[0] - bgA[0]) * (y / size)),
        Math.round(bgA[1] + (bgB[1] - bgA[1]) * (y / size)),
        Math.round(bgA[2] + (bgB[2] - bgA[2]) * (y / size)),
      ];

      for (const cellPos of cells) {
        const lx = x - cellPos.x;
        const ly = y - cellPos.y;
        if (
          lx >= 0 &&
          ly >= 0 &&
          lx < cell &&
          ly < cell &&
          insideRoundRect(lx, ly, cell, cell, innerR)
        ) {
          color = tile;
          break;
        }
      }

      pixels[i] = color[0];
      pixels[i + 1] = color[1];
      pixels[i + 2] = color[2];
      pixels[i + 3] = 255;
    }
  }

  const raw = Buffer.alloc(size * (1 + size * 4));
  for (let y = 0; y < size; y++) {
    raw[y * (1 + size * 4)] = 0;
    pixels.copy(raw, y * (1 + size * 4) + 1, y * size * 4, (y + 1) * size * 4);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  const compressed = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const outDir = path.join(__dirname, "..", "icons");
fs.mkdirSync(outDir, { recursive: true });

for (const size of [16, 32, 48, 128]) {
  const file = path.join(outDir, `icon${size}.png`);
  fs.writeFileSync(file, createPng(size));
  console.log(`Wrote ${file}`);
}
