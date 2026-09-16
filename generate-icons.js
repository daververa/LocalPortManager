const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

function crc32(buf) {
  let table = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const toCrc = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(toCrc), 0);
  return Buffer.concat([len, toCrc, crcBuf]);
}

function createPng(width, height, getPixel) {
  const header = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8);
  ihdr.writeUInt8(6, 9);
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);
  const ihdrChunk = makeChunk('IHDR', ihdr);

  const scanlines = [];
  for (let y = 0; y < height; y++) {
    const line = Buffer.alloc(1 + width * 4);
    line[0] = 0;
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y, width, height);
      const offset = 1 + x * 4;
      line[offset] = r;
      line[offset + 1] = g;
      line[offset + 2] = b;
      line[offset + 3] = a;
    }
    scanlines.push(line);
  }
  const rawData = Buffer.concat(scanlines);
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

function getIconPixel(x, y, width, height) {
  const cx = (width - 1) / 2;
  const cy = (height - 1) / 2;
  const r = width / 2;

  const nx = (x - cx) / (r * 0.90);
  const ny = (y - cy) / (r * 0.90);

  // Superellipse squircle
  const squircleDist = Math.pow(nx, 4) + Math.pow(ny, 4);
  if (squircleDist > 1.15) {
    return [0, 0, 0, 0];
  }

  let alpha = 255;
  if (squircleDist > 0.88) {
    alpha = Math.max(0, Math.min(255, Math.floor((1.15 - squircleDist) / (1.15 - 0.88) * 255)));
  }

  // Apple vibrant Blue gradient (#007AFF -> #0051C7)
  let bgR = 0;
  let bgG = Math.floor(122 - (y / height) * 40);
  let bgB = Math.floor(255 - (y / height) * 50);

  const distCenter = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
  
  // Center LED dot: Glowing Emerald Green (#34C759) with white center
  const dotR = width * 0.17;
  if (distCenter <= dotR) {
    if (distCenter <= dotR * 0.45) {
      return [255, 255, 255, alpha];
    }
    return [52, 199, 89, alpha];
  }

  // Port Ring (socket indicator)
  const ringInner = width * 0.28;
  const ringOuter = width * 0.38;
  if (distCenter >= ringInner && distCenter <= ringOuter) {
    return [255, 255, 255, Math.floor(alpha * 0.95)];
  }

  return [bgR, bgG, bgB, alpha];
}

function createIco(pngBuffers) {
  const count = pngBuffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Icon
  header.writeUInt16LE(count, 4); // Count

  let offset = 6 + count * 16;
  const dirEntries = [];
  for (const { width, height, buf } of pngBuffers) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(width >= 256 ? 0 : width, 0);
    entry.writeUInt8(height >= 256 ? 0 : height, 1);
    entry.writeUInt8(0, 2); // Colors
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(buf.length, 8); // Size
    entry.writeUInt32LE(offset, 12); // Offset
    dirEntries.push(entry);
    offset += buf.length;
  }

  return Buffer.concat([header, ...dirEntries, ...pngBuffers.map(p => p.buf)]);
}

const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

const png16 = createPng(16, 16, getIconPixel);
const png32 = createPng(32, 32, getIconPixel);
const png48 = createPng(48, 48, getIconPixel);
const png64 = createPng(64, 64, getIconPixel);
const png128 = createPng(128, 128, getIconPixel);
const png256 = createPng(256, 256, getIconPixel);

fs.writeFileSync(path.join(assetsDir, 'tray-icon.png'), png32);
fs.writeFileSync(path.join(assetsDir, 'tray-icon-16.png'), png16);
fs.writeFileSync(path.join(assetsDir, 'icon.png'), png256);

const icoBuf = createIco([
  { width: 16, height: 16, buf: png16 },
  { width: 32, height: 32, buf: png32 },
  { width: 48, height: 48, buf: png48 },
  { width: 64, height: 64, buf: png64 },
  { width: 128, height: 128, buf: png128 },
  { width: 256, height: 256, buf: png256 },
]);
fs.writeFileSync(path.join(assetsDir, 'icon.ico'), icoBuf);

console.log('Generated tray-icon.png, icon.png (256x256), icon.ico (up to 256x256) in assets/');
