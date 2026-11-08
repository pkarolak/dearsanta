// Builds the landing-film assets in public/show/film from design/src.
// Run from design/tools: node build-film.mjs
import { removeBackground } from "@imgly/background-removal-node";
import sharp from "sharp";
import { mkdir, readFile } from "node:fs/promises";

const src = (f) => new URL(`../src/${f}`, import.meta.url).pathname;
const out = (f) => new URL(`../../public/show/${f}`, import.meta.url).pathname;
await mkdir(out("film"), { recursive: true });

async function cutout(input) {
  const buffer = typeof input === "string" ? await readFile(src(input)) : input;
  const blob = new Blob([buffer], { type: "image/png" });
  const png = await removeBackground(blob, { output: { format: "image/png", quality: 1 } });
  return sharp(Buffer.from(await png.arrayBuffer())).trim({ threshold: 1 });
}

async function save(img, name, width) {
  const info = await img.clone().resize({ width, withoutEnlargement: true }).webp({ quality: 84, alphaQuality: 90 }).toFile(out(name));
  console.log(name, `${info.width}x${info.height}`);
}

for (const set of ["village", "workshop", "stable", "factory"]) {
  await save(sharp(src(`${set}.jpg`)).resize({ width: 1920, kernel: "lanczos3" }), `film/${set}.webp`, 1920);
}

// The full-body pair replaces the old waist-up elves everywhere.
await save(await cutout("elves-full.jpg"), "elves.webp", 900);

// The background remover keeps only a translucent ghost of the snowball elf's flying hat; drop it.
{
  const { data, info } = await (await cutout("elf-snowball.jpg")).raw().toBuffer({ resolveWithObject: true });
  for (let y = 0; y < info.height * 0.3; y++) {
    for (let x = y < info.height * 0.14 ? 0 : Math.floor(info.width * 0.55); x < info.width; x++) {
      const a = (y * info.width + x) * 4 + 3;
      if (data[a] < 230) data[a] = 0;
    }
  }
  await save(sharp(data, { raw: info }).trim({ threshold: 1 }), "film/elf-snowball.webp", 600);
}

for (const [file, name, width] of [
  ["elf-sled.jpg", "film/elf-sled.webp", 760],
  ["reindeer-sick.jpg", "film/reindeer-sick.webp", 800],
  ["sleigh.jpg", "film/sleigh.webp", 1000],
  ["list.jpg", "film/list.webp", 420],
]) {
  await save(await cutout(file), name, width);
}

const gifts = sharp(src("gifts.jpg"));
const { width, height } = await gifts.metadata();
const third = Math.floor(width / 3);
for (const [i, name] of ["red", "green", "gold"].entries()) {
  const slice = await sharp(src("gifts.jpg")).extract({ left: i * third, top: 0, width: third, height }).png().toBuffer();
  await save(await cutout(slice), `film/gift-${name}.webp`, 300);
}
