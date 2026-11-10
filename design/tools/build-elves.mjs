// Builds public/elves from the portraits made by elves.mjs:
// - every look/skin/hat portrait with the studio backdrop removed and its grey sweater bleached, so any colour can be multiplied onto it,
// - a sweater mask per portrait,
// - facial hair and glasses layers, each cut from the hairstyle's own portrait,
// - src/lib/elfGeometry.json: where the eyes sit on every image, so layers can be fitted to the face they land on.
// Run from design/tools: node build-elves.mjs [portraits|layers]
import { removeBackground } from "@imgly/background-removal-node";
import sharp from "sharp";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const root = new URL("../../", import.meta.url).pathname;
const src = (n) => `${root}design/elves/${n}.png`;
const dest = `${root}public/elves`;
const geoFile = `${root}src/lib/elfGeometry.json`;
const S = 512;
const OUT = 384;

const ids = ["waves", "braids", "bob", "puffs", "ponytail", "granny", "pixie", "bun", "short", "slick", "tousled", "grandpa", "curls", "quiff", "manbun"];
const skins = [0, 1, 2, 3, 4];
const hats = ["none", "santa", "elf", "beanie", "antlers"];
const facial = ["moustache", "goatee", "beard"];

const photo = (name) => sharp(src(name)).resize(S, S).removeAlpha().raw().toBuffer();
async function cut(name) {
  const png = await sharp(src(name)).resize(S, S).png().toBuffer();
  const blob = await removeBackground(new Blob([png], { type: "image/png" }), { output: { format: "image/png", quality: 1 } });
  return sharp(Buffer.from(await blob.arrayBuffer())).resize(S, S).ensureAlpha().raw().toBuffer();
}
const save = (rgba, file, channels = 4) =>
  sharp(rgba, { raw: { width: S, height: S, channels } }).resize(OUT, OUT).webp({ quality: 82, alphaQuality: 90 }).toFile(`${dest}/${file}.webp`);

/** Centres of the two white felt eyes: [x, y, distance] as fractions of the image. */
function eyes(rgb, fallback, label = "") {
  // Felt eye whites are the brightest neutral patch around the middle of the face; set the cut-off from them.
  const lums = [];
  for (let y = Math.round(S * 0.28); y < S * 0.62; y++)
    for (let x = Math.round(S * 0.22); x < S * 0.78; x++) {
      const i = (y * S + x) * 3, r = rgb[i], g = rgb[i + 1], b = rgb[i + 2];
      if (Math.max(r, g, b) - Math.min(r, g, b) < 20) lums.push(Math.min(r, g, b));
    }
  lums.sort((a, b) => b - a);
  const top = lums[Math.floor(lums.length * 0.004)] ?? 255;
  // The studio backdrop is a pale neutral grey too: stay clearly above it.
  let bg = 0;
  for (let y = 4; y < 40; y++) for (let x = 4; x < 40; x++) bg = Math.max(bg, rgb[(y * S + x) * 3 + 1]);
  for (const loose of [1, 1.5, 2.2])
    for (const t of [top - 30, top - 42, top - 54, top - 18]) {
      const found = eyesAt(rgb, Math.max(bg + 12, t), loose);
      if (found) return found;
    }
  if (fallback) return fallback;
  throw new Error(`eyes not found ${label}`);
}

function eyesAt(rgb, t, loose, ch = 3) {
  const seen = new Uint8Array(S * S);
  const white = (p) => {
    const i = p * ch, r = rgb[i], g = rgb[i + 1], b = rgb[i + 2];
    return r > t && g > t - 4 && b > t - 16 && Math.max(r, g, b) - Math.min(r, g, b) < 32;
  };
  const blobs = [];
  for (let y = Math.round(S * 0.28); y < S * 0.62; y++)
    for (let x = Math.round(S * 0.22); x < S * 0.78; x++) {
      const p0 = y * S + x;
      if (seen[p0] || !white(p0)) continue;
      let n = 0, sx = 0, sy = 0, minX = S, maxX = 0, minY = S, maxY = 0;
      const stack = [p0];
      seen[p0] = 1;
      while (stack.length) {
        const p = stack.pop(), px = p % S, py = (p / S) | 0;
        n++; sx += px; sy += py;
        minX = Math.min(minX, px); maxX = Math.max(maxX, px); minY = Math.min(minY, py); maxY = Math.max(maxY, py);
        for (const q of [p - 1, p + 1, p - S, p + S]) {
          const qx = q % S, qy = (q / S) | 0;
          if (q < 0 || q >= S * S || seen[q] || Math.abs(qx - px) > 1 || qy < S * 0.2 || qy > S * 0.7) continue;
          if (!white(q)) continue;
          seen[q] = 1;
          stack.push(q);
        }
      }
      blobs.push({ n, x: sx / n, y: sy / n, w: maxX - minX + 1, h: maxY - minY + 1 });
    }
  blobs.sort((a, b) => b.n - a.n);
  // An eye white is a compact blob, roughly as tall as it is wide.
  const pair = blobs.filter((b) => b.n > 120 / loose && b.n > (0.25 / loose) * b.w * b.h && b.w < S * 0.16 * loose && b.h < S * 0.16 * loose && b.w / b.h < 2.8 * loose && b.h / b.w < 2.2 * loose).slice(0, 8);
  let best = null;
  for (let i = 0; i < pair.length; i++)
    for (let j = i + 1; j < pair.length; j++) {
      const [a, b] = [pair[i], pair[j]];
      const dx = Math.abs(a.x - b.x), dy = Math.abs(a.y - b.y);
      if (dx < S * 0.08 || dx > S * 0.2 || dy > S * 0.04 || Math.abs(a.n - b.n) > Math.min(0.9, 0.6 * loose) * Math.max(a.n, b.n)) continue;
      const score = Math.min(a.n, b.n);
      if (!best || score > best.score) best = { score, a, b };
    }
  if (!best) return null;
  const cx = (best.a.x + best.b.x) / 2, cy = (best.a.y + best.b.y) / 2;
  const d = Math.hypot(best.a.x - best.b.x, best.a.y - best.b.y);
  return [cx / S, cy / S, d / S].map((v) => Math.round(v * 1e4) / 1e4);
}

async function soften(mask, radius = 1.4, lo = 0.35, span = 0.3) {
  const g = Buffer.from(mask.map((v) => Math.round(v * 255)));
  const blurred = await sharp(g, { raw: { width: S, height: S, channels: 1 } }).blur(radius).extractChannel(0).raw().toBuffer();
  return Float32Array.from(blurred, (v) => Math.min(1, Math.max(0, (v / 255 - lo) / span)));
}

/** Drops specks: keeps connected parts of the mask that are at least `share` of the biggest one. */
function keepBig(mask, share = 0.08) {
  const label = new Int32Array(S * S).fill(-1);
  const sizes = [];
  for (let p0 = 0; p0 < S * S; p0++) {
    if (mask[p0] < 0.5 || label[p0] >= 0) continue;
    const id = sizes.length;
    let n = 0;
    const stack = [p0];
    label[p0] = id;
    while (stack.length) {
      const p = stack.pop();
      n++;
      for (const q of [p - 1, p + 1, p - S, p + S]) {
        if (q < 0 || q >= S * S || label[q] >= 0 || mask[q] < 0.5 || Math.abs((q % S) - (p % S)) > 1) continue;
        label[q] = id;
        stack.push(q);
      }
    }
    sizes.push(n);
  }
  const max = Math.max(0, ...sizes);
  return Float32Array.from(mask, (v, p) => (label[p] >= 0 && sizes[label[p]] >= max * share ? 1 : 0));
}

await mkdir(dest, { recursive: true });
const geo = JSON.parse(await readFile(geoFile, "utf8").catch(() => "{}"));
const only = process.argv[2];

if (!only || only === "portraits") {
  for (const id of ids) {
    for (const skin of skins)
      for (const hat of hats) {
        const name = `${id}-${skin}-${hat}`;
        if (!(await readFile(src(name)).catch(() => null))) {
          console.log("missing", name);
          continue;
        }
        const [img, rgb] = [await cut(name), await photo(name)];
        geo[name] = eyes(rgb, null, name);
        // The bare sweater is light grey knit: bleach it so the chosen colour can be multiplied on, keeping the knit's shading.
        const mask = new Float32Array(S * S);
        let sum = 0, n = 0;
        for (let p = Math.round(S * 0.66) * S; p < S * S; p++) {
          const i = p * 4, r = img[i], g = img[i + 1], b = img[i + 2];
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          if (img[i + 3] > 128 && Math.max(r, g, b) - Math.min(r, g, b) < 22 && lum > 70 && lum < 215) {
            mask[p] = 1;
            sum += lum;
            n++;
          }
        }
        const soft = await soften(keepBig(mask, 0.2), 1.2);
        const mean = sum / Math.max(1, n);
        const alpha = Buffer.alloc(S * S * 4);
        for (let p = 0; p < S * S; p++) {
          const i = p * 4;
          if (soft[p] > 0) {
            const k = soft[p], lum = 0.299 * img[i] + 0.587 * img[i + 1] + 0.114 * img[i + 2];
            const v = Math.min(255, (lum / mean) * 228);
            for (let c = 0; c < 3; c++) img[i + c] = Math.round(img[i + c] * (1 - k) + v * k);
          }
          alpha[i] = alpha[i + 1] = alpha[i + 2] = 255;
          alpha[i + 3] = Math.round(soft[p] * 255);
        }
        await save(img, `elf-${name}`);
        await save(alpha, `sweater-${name}`);
      }
    console.log("portraits", id);
  }
}

/** A layer cut from `layerName`: what changed against the hairstyle's bare portrait inside `region`, after lining the two up by the eyes. */
async function layerOf(layerName, baseName, region, keep, trustEyes = true, threshold = 46) {
  const [l, lp, bp] = [await cut(layerName), await photo(layerName), await photo(baseName)];
  const gb = eyes(bp, null, baseName);
  // Lenses make eyes look bigger, and a misread pair is far off: in both cases the edit kept the face where the base has it.
  let gl = trustEyes ? eyes(lp, gb, layerName) : gb;
  if (Math.abs(gl[2] / gb[2] - 1) > 0.12 || Math.hypot(gl[0] - gb[0], gl[1] - gb[1]) > 0.05) gl = gb;
  const k = gb[2] / gl[2];
  const mask = new Float32Array(S * S);
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const p = y * S + x;
      if (l[p * 4 + 3] < 128 || !region(x / S, y / S, gl)) continue;
      const bx = Math.round(((x / S - gl[0]) * k + gb[0]) * S), by = Math.round(((y / S - gl[1]) * k + gb[1]) * S);
      if (bx < 0 || by < 0 || bx >= S || by >= S) continue;
      const i = p * 3, j = (by * S + bx) * 3;
      const diff = Math.hypot(lp[i] - bp[j], lp[i + 1] - bp[j + 1], lp[i + 2] - bp[j + 2]);
      if (diff > threshold && keep(lp[i], lp[i + 1], lp[i + 2])) mask[p] = 1;
    }
  if (process.env.DEBUG) console.log(layerName, "gl", gl, "gb", gb, "raw", mask.reduce((a, v) => a + v, 0));
  // Close the gaps between strands, then drop the specks.
  const closed = await soften(mask, 2.2, 0.25, 0.2);
  const soft = await soften(keepBig(closed), 1.1);
  for (let p = 0; p < S * S; p++) l[p * 4 + 3] = Math.round(soft[p] * 255);
  return { out: l, g: gl };
}

if (!only || only === "layers") {
  const notMouth = (r, g, b) => !(r - g > 125 && r - b > 110);
  // Ginger and blond yarn sit close to the felt skin, so a smaller change already counts.
  const nearSkin = new Set(["ponytail", "quiff", "tousled", "braids"]);
  for (const id of ids) {
    for (const kind of facial) {
      const below = (x, y, [cx, cy, d]) => y > cy + 0.55 * d && y < cy + 3.4 * d && Math.abs(x - cx) < 1.9 * d;
      const { out, g } = await layerOf(`${id}-1-${kind}`, `${id}-1-none`, below, notMouth, true, nearSkin.has(id) ? 26 : 46);
      geo[`${kind}-${id}`] = g;
      await save(out, `${kind}-${id}`);
    }
    const band = (x, y, [cx, cy, d]) => y > cy - 0.62 * d && y < cy + 0.55 * d && Math.abs(x - cx) < 1.55 * d;
    const frame = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b < 150;
    // The content checker refuses a few hairstyles with glasses; glasses sit on the face, so another hairstyle's pair fits them.
    const from = (await readFile(src(`${id}-1-glasses`)).catch(() => null)) ? id : "short";
    const { out, g } = await layerOf(`${from}-1-glasses`, `${from}-1-none`, band, frame, false);
    geo[`glasses-${id}`] = g;
    await save(out, `glasses-${id}`);
    console.log("layers", id);
  }
}

await writeFile(geoFile, JSON.stringify(Object.fromEntries(Object.entries(geo).sort(([a], [b]) => a.localeCompare(b)))) + "\n");
