// Builds the puppet avatar assets in public/avatars from the portraits made by avatars.mjs.
// Faces are whole portraits; hats, scarves, glasses and the sweater colour are layers cut out against the bare portrait.
// Run from design/tools: node build-avatars.mjs
import { removeBackground } from "@imgly/background-removal-node";
import sharp from "sharp";
import { mkdir, rm } from "node:fs/promises";

const root = new URL("../../", import.meta.url).pathname;
const src = (n) => (n === "master" ? `${root}design/src/avatar-master.jpg` : `${root}design/avatars/${n}.png`);
const dest = `${root}public/avatars`;
const S = 512;
const OUT = 384;

const skins = [0, 1, 2, 3, 4];
const styles = ["short", "long", "bun", "curly"];
const colors = [0, 1, 2, 3, 4, 5];
const hats = ["santa", "elf", "beanie", "antlers"];
const scarves = ["B3261E", "2F5D46", "E7B54A", "F4EFE6"];
const sweaters = ["B3261E", "2F5D46", "1F3A5F", "E7B54A", "F4EFE6"];

const cache = new Map();
/** The portrait at working size as RGBA with the studio background removed. */
async function cut(name) {
  if (cache.has(name)) return cache.get(name);
  const png = await sharp(src(name)).resize(S, S).png().toBuffer();
  const blob = await removeBackground(new Blob([png], { type: "image/png" }), { output: { format: "image/png", quality: 1 } });
  const data = await sharp(Buffer.from(await blob.arrayBuffer())).resize(S, S).ensureAlpha().raw({ depth: "uchar" }).toBuffer();
  if (data.length !== S * S * 4) throw new Error(`${name}: unexpected cut-out size ${data.length}`);
  cache.set(name, data);
  return data;
}

const save = (rgba, file) =>
  sharp(rgba, { raw: { width: S, height: S, channels: 4 } }).resize(OUT, OUT).webp({ quality: 82, alphaQuality: 90 }).toFile(`${dest}/${file}.webp`);

/** Softens a 0..1 mask and drops specks, so cut-out edges stay clean. */
async function soften(mask, radius = 1.6) {
  const g = Buffer.from(mask.map((v) => Math.round(v * 255)));
  const blurred = await sharp(g, { raw: { width: S, height: S, channels: 1 } }).blur(radius).extractChannel(0).raw().toBuffer();
  return Float32Array.from(blurred, (v) => Math.min(1, Math.max(0, (v / 255 - 0.35) / 0.3)));
}

const dist = (a, b, i) => Math.hypot(a[i] - b[i], a[i + 1] - b[i + 1], a[i + 2] - b[i + 2]);

/** The portrait at working size as RGBA, studio background and all. */
const photo = (name) => sharp(src(name)).resize(S, S).ensureAlpha().raw({ depth: "uchar" }).toBuffer();

/**
 * Pixels of `layer` that differ from `base` inside `region(x, y)`: the hat, scarf or glasses on their own.
 * Compared photo to photo, studio background included, so pale wool against the grey backdrop isn't lost.
 */
async function layerOf(layerName, baseName, region, { threshold = 42, keepPixel = () => true } = {}) {
  const [l, b, lp, bp, m] = await Promise.all([cut(layerName), cut(baseName), photo(layerName), photo(baseName), photo("master")]);
  // Skin the edit uncovered (a forehead under a hat brim) is the master's skin, wrong for every other tone.
  const skinAt = (180 * S + 256) * 4;
  const lum = (d, i) => 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
  const mask = new Float32Array(S * S);
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const p = y * S + x, i = p * 4;
      if (!region(x, y) || !keepPixel(lp, i)) continue;
      const warm = lp[i] - lp[i + 2] > 70 && lum(lp, i) > 115;
      if (warm && Math.hypot(lp[i] - m[skinAt], lp[i + 1] - m[skinAt + 1], lp[i + 2] - m[skinAt + 2]) < 90) continue;
      // Over the backdrop anything new is the hat; over the puppet, only what the cut-out also calls puppet,
      // so backdrop showing where the hat squashed the hair doesn't come along.
      if (b[i + 3] < 128 ? dist(lp, bp, i) > 26 : l[i + 3] > 128 && dist(lp, bp, i) > threshold) mask[p] = 1;
    }
  const soft = await soften(mask);
  const out = Buffer.from(lp);
  for (let p = 0; p < S * S; p++) out[p * 4 + 3] = Math.round(soft[p] * 255);
  return { out, l, b };
}

const layersOnly = process.argv[2] === "layers";
if (!layersOnly) await rm(dest, { recursive: true, force: true });
await mkdir(dest, { recursive: true });

const base = (style) => (style === "bald" ? "master" : `hair-${style}-1`);
const faceName = (skin, hair) =>
  skin === 1 ? (hair === "bald" ? "master" : `hair-${hair}`) : `face-${skin}-${hair}`;

/**
 * The edit model kept giving bald puppets hair, so bald faces are the bald master with its felt recoloured
 * to the tone of that skin's other portraits, keeping the felt's light and shade.
 */
async function baldFace(skin) {
  const m = await cut("master");
  const ref = await cut(`face-${skin}-short-1`);
  const isSkin = (r, g, b) => {
    const ratio = g / Math.max(1, r);
    return r - b > 25 && ratio > 0.52 && ratio < 0.88;
  };
  const sample = (d) => {
    const acc = [0, 0, 0];
    let n = 0;
    for (let y = 230; y < 330; y++)
      for (let x = 150; x < 362; x++) {
        const i = (y * S + x) * 4;
        if (d[i + 3] < 200 || !isSkin(d[i], d[i + 1], d[i + 2]) || d[i] + d[i + 1] + d[i + 2] > 600) continue;
        for (let k = 0; k < 3; k++) acc[k] += d[i + k];
        n++;
      }
    return acc.map((v) => v / n);
  };
  const [from, to] = [sample(m), sample(ref)];
  const lum = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
  const l0 = lum(...from);
  const out = Buffer.from(m);
  for (let p = 0; p < S * S; p++) {
    const i = p * 4, [r, g, b] = [m[i], m[i + 1], m[i + 2]];
    if (!(r - b > 45 && g / Math.max(1, r) > 0.55 && g / Math.max(1, r) < 0.88)) continue;
    const k = lum(r, g, b) / l0;
    for (let c = 0; c < 3; c++) out[i + c] = Math.min(255, to[c] * k);
  }
  return out;
}

for (const skin of layersOnly ? [] : skins) {
  for (const hair of ["bald", ...styles.flatMap((s) => colors.map((c) => `${s}-${c}`))]) {
    const face = hair === "bald" && skin !== 1 ? await baldFace(skin) : await cut(faceName(skin, hair));
    await save(face, `face-${skin}-${hair}`);
  }
  console.log("faces for skin", skin);
}

const hatRegion = (x, y) => y < 262 || (x > 222 && x < 296 && y < 336);
// Studio grey peeking through where a hat squashed the hair; the hats' own whites are brighter than this.
const notBackdrop = (d, i) => {
  const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
  return !(Math.max(d[i], d[i + 1], d[i + 2]) - Math.min(d[i], d[i + 1], d[i + 2]) < 16 && lum > 140 && lum < 218);
};
for (const style of ["bald", ...styles]) {
  for (const hat of hats) {
    const { out, l, b } = await layerOf(`hat-${style}-${hat}`, base(style), hatRegion, { keepPixel: notBackdrop });
    await save(out, `hat-${style}-${hat}`);
    // Where the hat squashes the hair, the bare portrait shows hair the hatted one doesn't: mask it away.
    const keep = new Float32Array(S * S).fill(1);
    for (let p = 0; p < S * S; p++) if (p < 262 * S && b[p * 4 + 3] > 128 && l[p * 4 + 3] < 96) keep[p] = 0;
    const soft = await soften(keep.map((v) => 1 - v), 1.2);
    const mask = Buffer.alloc(S * S * 4, 255);
    for (let p = 0; p < S * S; p++) mask[p * 4 + 3] = Math.round((1 - soft[p]) * 255);
    await save(mask, `keep-${style}-${hat}`);
  }
}
console.log("hats");

for (const hex of scarves) await save((await layerOf(`scarf-${hex}`, "master", (_x, y) => y > 372, { threshold: 30 })).out, `scarf-${hex}`);
const darkFrame = (d, i) => 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2] < 100;
await save((await layerOf("glasses", "master", (_x, y) => y > 196 && y < 316, { threshold: 30, keepPixel: darkFrame })).out, "glasses");
console.log("scarves, glasses");

// The bare sweater is light grey knit: recolour it per option, keeping the knit's light and shade.
for (const style of ["bald", ...styles]) {
  const b = await cut(base(style));
  const mask = new Float32Array(S * S);
  let sum = 0, n = 0;
  for (let p = 400 * S; p < S * S; p++) {
    const i = p * 4, r = b[i], g = b[i + 1], bl = b[i + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * bl;
    if (b[i + 3] > 128 && Math.max(r, g, bl) - Math.min(r, g, bl) < 20 && lum > 85 && lum < 215) {
      mask[p] = 1;
      sum += lum;
      n++;
    }
  }
  const soft = await soften(mask, 1.2);
  const mean = sum / n;
  for (const hex of sweaters) {
    const c = [0, 2, 4].map((k) => parseInt(hex.slice(k, k + 2), 16));
    const out = Buffer.alloc(S * S * 4);
    for (let p = 0; p < S * S; p++) {
      const i = p * 4, k = (0.299 * b[i] + 0.587 * b[i + 1] + 0.114 * b[i + 2]) / mean;
      out[i] = Math.min(255, c[0] * k);
      out[i + 1] = Math.min(255, c[1] * k);
      out[i + 2] = Math.min(255, c[2] * k);
      out[i + 3] = Math.round(soft[p] * 255);
    }
    await save(out, `sweater-${style}-${hex}`);
  }
}
console.log("sweaters");
