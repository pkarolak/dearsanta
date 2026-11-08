import sharp from "sharp";
const p = (f) => new URL(`../../public/show/${f}`, import.meta.url).pathname;
const L = { left: 230, top: 390 };
const tiles = [];
for (const m of [null, "half", "open"]) {
  const layers = [{ input: p("santa.webp") }];
  if (m) layers.push({ input: p(`santa-mouth-${m}.webp`), left: L.left, top: L.top });
  tiles.push(await sharp({ create: { width: 864, height: 1152, channels: 4, background: "#2f6b4a" } }).composite(layers).png().toBuffer());
}
const extras = [];
for (const f of ["reindeer.webp", "stocking.webp", "elves.webp"]) {
  extras.push(await sharp({ create: { width: 864, height: 1152, channels: 4, background: "#b8282f" } })
    .composite([{ input: await sharp(p(f)).resize({ width: 800, height: 1100, fit: "inside" }).toBuffer(), gravity: "center" }]).png().toBuffer());
}
const all = [...tiles, ...extras];
await sharp({ create: { width: 864 * 6, height: 1152, channels: 4, background: "#fff" } })
  .composite(all.map((input, i) => ({ input, left: i * 864, top: 0 }))).png().toBuffer().then((b) => sharp(b).resize({ width: 2400 }).jpeg().toFile("../preview-cast.jpg"));
