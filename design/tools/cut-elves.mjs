// Cuts public/show/elves.webp into puppet parts (body, head, waving arm, two legs) per elf.
// Moving parts get a soft edge where they overlap the body, and the body keeps its pixels under
// that edge, so at rest the layers add up to the original picture.
// Usage: node design/tools/cut-elves.mjs [--debug]
import sharp from "sharp";

const src = "public/show/elves.webp";
const out = "public/show/elves";

/** Coordinates are in the source picture (807×944). Elf a's right ear pokes past the hands' seam. */
const ownedByA = (x, y) => x < (y < 400 ? 430 : 404);

const elves = {
  a: {
    box: [0, 432],
    head: { x: [112, 432], fade: [362, 394] },
    arm: {
      poly: [[0, 205], [114, 205], [122, 318], [168, 358], [188, 384], [178, 448], [132, 472], [98, 442], [28, 372], [0, 336]],
      pivot: [158, 418],
      fade: [22, 58],
    },
    legs: { top: 702, cut: 738, split: 222 },
  },
  b: {
    box: [404, 807],
    head: { x: [426, 724], fade: [402, 432] },
    arm: {
      poly: [[724, 322], [807, 322], [807, 458], [772, 474], [702, 502], [650, 518], [618, 474], [648, 436], [700, 404], [724, 394]],
      pivot: [642, 470],
      fade: [22, 58],
    },
    legs: { top: 706, cut: 742, split: 562 },
  },
};

const clamp = (v) => Math.max(0, Math.min(1, v));

function inPoly([x, y], poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;
const debug = process.argv.includes("--debug");
await import("node:fs").then((fs) => fs.mkdirSync(out, { recursive: true }));

for (const [name, elf] of Object.entries(elves)) {
  const [x0, x1] = elf.box;
  const w = x1 - x0;
  const parts = Object.fromEntries(["body", "head", "arm", "leg-l", "leg-r"].map((p) => [p, Buffer.alloc(w * H * 4)]));
  const tint = Buffer.alloc(w * H * 4);

  for (let y = 0; y < H; y++) {
    for (let x = x0; x < x1; x++) {
      const s = (y * W + x) * 4;
      const a = data[s + 3];
      if (!a || ownedByA(x, y) !== (name === "a")) continue;

      const { poly, pivot, fade } = elf.arm;
      const armShape = inPoly([x, y], poly);
      const d = Math.hypot(x - pivot[0], y - pivot[1]);
      const arm = armShape ? clamp((d - fade[0]) / (fade[1] - fade[0])) : 0;

      const { x: hx, fade: hf } = elf.head;
      const headZone = x >= hx[0] && x < hx[1] && !armShape;
      const head = headZone ? clamp((hf[1] - y) / (hf[1] - hf[0])) : 0;

      const { top, cut, split } = elf.legs;
      const leg = y >= top ? 1 : 0;
      const body = arm >= 1 || (headZone && y < hf[0]) || y >= cut ? 0 : 1;

      const put = (part, m) => {
        if (m <= 0) return;
        const o = (y * w + (x - x0)) * 4;
        data.copy(parts[part], o, s, s + 3);
        parts[part][o + 3] = Math.round(a * m);
      };
      put("arm", arm);
      put("head", head);
      put(x < split ? "leg-l" : "leg-r", leg);
      put("body", body);

      if (debug) {
        const o = (y * w + (x - x0)) * 4;
        const c = arm >= 1 ? [255, 0, 255] : arm > 0 ? [255, 140, 255] : head >= 1 ? [0, 170, 255] : head > 0 ? [140, 210, 255] : y >= cut ? (x < split ? [255, 200, 0] : [0, 220, 120]) : leg ? [255, 255, 160] : [200, 200, 200];
        for (let k = 0; k < 3; k++) tint[o + k] = Math.round(data[s + k] * 0.45 + c[k] * 0.55);
        tint[o + 3] = 255;
      }
    }
  }

  for (const [part, buf] of Object.entries(parts)) {
    await sharp(buf, { raw: { width: w, height: H, channels: 4 } }).webp({ quality: 88, alphaQuality: 100 }).toFile(`${out}/${name}-${part}.webp`);
  }
  if (debug) await sharp(tint, { raw: { width: w, height: H, channels: 4 } }).jpeg({ quality: 80 }).toFile(`design/shots/elf-${name}-masks.jpg`);
}
console.log("cut", Object.keys(elves).join(", "));
