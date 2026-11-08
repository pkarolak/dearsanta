// Builds the elf pair cutout (public/show/elves.webp) from design/src. The film itself is video: see clips.mjs.
// Run from design/tools: node build-film.mjs
import { removeBackground } from "@imgly/background-removal-node";
import sharp from "sharp";
import { readFile } from "node:fs/promises";

const src = (f) => new URL(`../src/${f}`, import.meta.url).pathname;
const out = (f) => new URL(`../../public/show/${f}`, import.meta.url).pathname;

const blob = new Blob([await readFile(src("elves-full.jpg"))], { type: "image/png" });
const png = await removeBackground(blob, { output: { format: "image/png", quality: 1 } });
const info = await sharp(Buffer.from(await png.arrayBuffer()))
  .trim({ threshold: 1 })
  .resize({ width: 900, withoutEnlargement: true })
  .webp({ quality: 84, alphaQuality: 90 })
  .toFile(out("elves.webp"));
console.log("elves.webp", `${info.width}x${info.height}`);
