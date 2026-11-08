import sharp from "sharp";
const load = async (f) => (await sharp(f).raw().toBuffer({ resolveWithObject: true }));
const [a, ...others] = await Promise.all(process.argv.slice(2).map(load));
const { width, height } = a.info;
for (const [i, b] of others.entries()) {
  let all = 0, outside = 0, nOut = 0;
  const rows = new Array(Math.ceil(height / 64)).fill(0), rowN = new Array(rows.length).fill(0);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const k = (y * width + x) * 3;
    const d = (Math.abs(a.data[k] - b.data[k]) + Math.abs(a.data[k+1] - b.data[k+1]) + Math.abs(a.data[k+2] - b.data[k+2])) / 3;
    all += d; rows[y >> 6] += d; rowN[y >> 6]++;
    if (y < 370 || y > 560) { outside += d; nOut++; }
  }
  console.log(process.argv[3 + i], "mean diff", (all / (width * height)).toFixed(2), "outside mouth band", (outside / nOut).toFixed(2));
  console.log("  per 64px band:", rows.map((r, j) => (r / rowN[j]).toFixed(1)).join(" "));
}
