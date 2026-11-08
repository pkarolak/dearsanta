// Turns the generated source photos in design/src into the web assets in public/show.
// Run from design/tools: node build-assets.mjs
import { removeBackground } from "@imgly/background-removal-node";
import sharp from "sharp";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const src = (f) => new URL(`../src/${f}`, import.meta.url).pathname;
const out = (f) => new URL(`../../public/show/${f}`, import.meta.url).pathname;
await mkdir(out(""), { recursive: true });

async function cutout(file) {
  const blob = new Blob([await readFile(src(file))], { type: "image/jpeg" });
  const png = await removeBackground(blob, { output: { format: "image/png", quality: 1 } });
  return sharp(Buffer.from(await png.arrayBuffer())).trim({ threshold: 1 });
}

async function save(img, name, width) {
  const info = await img.clone().resize({ width, withoutEnlargement: true }).webp({ quality: 84, alphaQuality: 90 }).toFile(out(name));
  console.log(name, `${info.width}x${info.height}`);
  return info;
}

// Santa: one cutout of the closed-mouth frame, plus feathered mouth patches from the talking frames,
// so only the mouth changes while he speaks.
const MOUTH = { left: 230, top: 390, width: 410, height: 280 };
const santaClosed = await removeBackground(new Blob([await readFile(src("santa-closed.jpg"))], { type: "image/jpeg" }), {
  output: { format: "image/png" },
});
const santaPng = Buffer.from(await santaClosed.arrayBuffer());
const { width: sw, height: sh } = await sharp(santaPng).metadata();
await save(sharp(santaPng), "santa.webp", 864);

const ellipse = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${MOUTH.width}" height="${MOUTH.height}">
    <defs><filter id="f" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="15"/></filter></defs>
    <ellipse cx="${MOUTH.width / 2}" cy="${MOUTH.height / 2}" rx="${MOUTH.width / 2 - 62}" ry="${MOUTH.height / 2 - 58}" fill="#fff" filter="url(#f)"/>
  </svg>`,
);
for (const shape of ["half", "open"]) {
  const raw = (f) => sharp(src(f)).extract(MOUTH).removeAlpha().raw().toBuffer();
  const [patch, base] = await Promise.all([raw(`santa-${shape}.jpg`), raw("santa-closed.jpg")]);
  const mask = await sharp(ellipse).resize(MOUTH.width, MOUTH.height).extractChannel(3).raw().toBuffer();
  // Match the patch's tone to the base frame where they blend (the feathered ring), so no oval shows.
  const sum = { p: [0, 0, 0], b: [0, 0, 0], n: 0 };
  for (let i = 0; i < mask.length; i++) {
    if (mask[i] < 20 || mask[i] > 200) continue;
    for (let c = 0; c < 3; c++) {
      sum.p[c] += patch[i * 3 + c];
      sum.b[c] += base[i * 3 + c];
    }
    sum.n++;
  }
  const gain = sum.p.map((p, c) => sum.b[c] / p);
  const raw3 = { raw: { width: MOUTH.width, height: MOUTH.height, channels: 3 } };
  const matched = await sharp(patch, raw3).linear(gain, [0, 0, 0]).raw().toBuffer();
  const rgba = await sharp(matched, raw3).joinChannel(mask, { raw: { width: MOUTH.width, height: MOUTH.height, channels: 1 } }).png().toBuffer();
  console.log(shape, "tone gain", gain.map((g) => g.toFixed(3)).join(" "));
  await save(sharp(rgba), `santa-mouth-${shape}.webp`, MOUTH.width);
}
const mouthBox = {
  left: +((MOUTH.left / sw) * 100).toFixed(3),
  top: +((MOUTH.top / sh) * 100).toFixed(3),
  width: +((MOUTH.width / sw) * 100).toFixed(3),
  height: +((MOUTH.height / sh) * 100).toFixed(3),
};

// Reindeer: find the blank white card inside the frame so the real QR code can sit on it.
const reindeer = await removeBackground(new Blob([await readFile(src("reindeer-frame.jpg"))], { type: "image/jpeg" }), {
  output: { format: "image/png" },
});
const reindeerPng = Buffer.from(await reindeer.arrayBuffer());
await save(sharp(reindeerPng), "reindeer.webp", 864);
const { data, info } = await sharp(src("reindeer-frame.jpg")).raw().toBuffer({ resolveWithObject: true });
let minX = info.width, minY = info.height, maxX = 0, maxY = 0;
for (let y = Math.floor(info.height * 0.45); y < info.height; y++) {
  for (let x = 0; x < info.width; x++) {
    const k = (y * info.width + x) * 3;
    if (data[k] > 245 && data[k + 1] > 245 && data[k + 2] > 245) {
      minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }
  }
}
const card = {
  left: +((minX / info.width) * 100).toFixed(2),
  top: +((minY / info.height) * 100).toFixed(2),
  width: +(((maxX - minX) / info.width) * 100).toFixed(2),
  height: +(((maxY - minY) / info.height) * 100).toFixed(2),
};

for (const [file, name, width] of [
  ["elves-duo.jpg", "elves.webp", 900],
  ["stocking.jpg", "stocking.webp", 420],
  ["presents-row.jpg", "presents.webp", 1600],
]) {
  await save(await cutout(file), name, width);
}

for (const [file, name] of [
  ["set-living-room.jpg", "set-living-room.webp"],
  ["set-stage.jpg", "set-stage.webp"],
]) {
  await save(sharp(src(file)).resize({ width: 1920, kernel: "lanczos3" }), name, 1920);
}
await save(sharp(src("curtain-panel.jpg")).resize({ width: 960 }), "curtain.webp", 960);

await emailSanta(santaPng);

const layout = { santaMouth: mouthBox, reindeerCard: card };
await writeFile(new URL("../../src/components/show/layout.json", import.meta.url).pathname, JSON.stringify(layout, null, 2) + "\n");
console.log(layout);

/** Head-and-shoulders PNG for e-mails, since plenty of mail clients still can't show WebP. */
export async function emailSanta(input) {
  const trimmed = await sharp(input).trim().toBuffer({ resolveWithObject: true });
  const height = Math.round(trimmed.info.height * 0.62);
  await sharp(trimmed.data)
    .extract({ left: 0, top: 0, width: trimmed.info.width, height })
    .resize({ width: 360 })
    .png({ compressionLevel: 9, palette: true, quality: 90 })
    .toFile(out("santa-email.png"));
}
