// Generates the puppet avatar portraits by editing one master puppet with an image-edit model on fal.ai,
// so every variant keeps the same framing and the hat, scarf and glasses layers line up on all of them.
// Run from design/tools: node avatars.mjs <job> [...]   (reads FAL_KEY from ../../.env.local)
import { mkdir, readFile, writeFile } from "node:fs/promises";

const root = new URL("../../", import.meta.url).pathname;
const env = await readFile(`${root}.env.local`, "utf8");
const key = /^FAL_KEY=(.+)$/m.exec(env)?.[1].trim();
if (!key) throw new Error("FAL_KEY missing in .env.local");

const MODEL = "fal-ai/nano-banana/edit";
const headers = { Authorization: `Key ${key}`, "Content-Type": "application/json" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const out = `${root}design/avatars`;
const KEEP =
  "Keep everything else exactly the same: same puppet, same face, same eyes, nose and open mouth, same head size and position, " +
  "same framing, same grey sweater, same lighting and the same plain grey background. Felt and yarn textures, Muppet puppet style.";

export async function edit(name, image, prompt, keep = true) {
  const data = await readFile(image);
  const res = await fetch(`https://queue.fal.run/${MODEL}`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      prompt: keep ? `${prompt} ${KEEP}` : prompt,
      image_urls: [`data:image/${image.endsWith(".png") ? "png" : "jpeg"};base64,${data.toString("base64")}`],
      num_images: 1,
      output_format: "png",
    }),
  });
  if (!res.ok) throw new Error(`${name}: submit ${res.status} ${await res.text()}`);
  const { status_url, response_url } = await res.json();
  for (;;) {
    await sleep(3000);
    const s = await (await fetch(status_url, { headers })).json();
    if (s.status === "COMPLETED") break;
    if (s.status !== "IN_QUEUE" && s.status !== "IN_PROGRESS") throw new Error(`${name}: ${JSON.stringify(s)}`);
  }
  const result = await (await fetch(response_url, { headers })).json();
  const url = result.images?.[0]?.url;
  if (!url) throw new Error(`${name}: ${JSON.stringify(result)}`);
  await mkdir(out, { recursive: true });
  const file = `${out}/${name}.png`;
  await writeFile(file, Buffer.from(await (await fetch(url)).arrayBuffer()));
  console.log(name, "saved");
  return file;
}

// The option values match src/lib/avatar.ts; index 1 is the master's own skin.
const skins = [
  "very light pale rosy peach",
  null,
  "light tan golden-brown",
  "medium warm brown",
  "deep dark brown",
];
const styles = {
  short: "short neat side-swept yarn hair",
  long: "long straight yarn hair with a centre parting, falling past the ears to the shoulders",
  bun: "yarn hair pulled up neatly into a round bun on top of the head",
  curly: "short tight curly yarn hair, a rounded afro shape",
};
const colors = ["near-black", "dark brown", "auburn copper", "golden blonde", "silver grey", "bright red"];
const hats = {
  santa: "a red felt Santa hat with a fluffy white trim and a white pompom flopping to the side",
  elf: "a tall pointy green felt elf hat with a red zigzag brim and a small gold bell at the tip, curling to the side",
  beanie: "a red knitted beanie with two cream stripes and a cream pompom on top",
  antlers: "a headband with two brown felt reindeer antlers, and also make the nose a round shiny red felt reindeer nose",
};
const scarves = { "B3261E": "red", "2F5D46": "dark green", "E7B54A": "mustard yellow", "F4EFE6": "cream white" };

const master = `${root}design/src/avatar-master.jpg`;
const f = (name) => `${out}/${name}.png`;
const exists = async (file) => !!(await readFile(file).catch(() => null));

/** Runs jobs at most `n` at a time, skipping any whose output already exists. */
async function run(jobs, n = 8) {
  const todo = [];
  for (const j of jobs) if (!(await exists(f(j.name)))) todo.push(j);
  console.log(`${todo.length} of ${jobs.length} to generate`);
  let i = 0;
  const failed = [];
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (i < todo.length) {
        const j = todo[i++];
        await edit(j.name, j.from, j.prompt, j.keep ?? true).catch((e) => failed.push(`${j.name}: ${e.message.slice(0, 160)}`));
      }
    }),
  );
  if (failed.length) console.log("FAILED\n" + failed.join("\n"));
}

const isolate = (item) =>
  `Remove the puppet completely: its head, face, hair, ears, neck and sweater all disappear. Keep ONLY ${item}, exactly where it is now, ` +
  "at exactly the same size, position, angle and shading, floating on its own. Replace everything else with a flat, even, pure chroma-key " +
  "green background (#00B140) with no shadows. Do not move, resize or redraw the item.";

const stage = process.argv[2];
if (stage === "isolate") {
  const items = { santa: "the Santa hat", elf: "the elf hat", beanie: "the knitted beanie", antlers: "the antler headband and the round red nose" };
  await run(
    [
      ...["bald", ...Object.keys(styles)].flatMap((s) =>
        Object.entries(items).map(([h, d]) => ({ name: `only-hat-${s}-${h}`, from: f(`hat-${s}-${h}`), prompt: isolate(d) })),
      ),
      ...Object.keys(scarves).map((hex) => ({ name: `only-scarf-${hex}`, from: f(`scarf-${hex}`), prompt: isolate("the knitted scarf") })),
      { name: "only-glasses", from: f("glasses"), prompt: isolate("the pair of glasses") },
    ].map((j) => ({ ...j, keep: false })),
  );
}
const hairName = (style, c) => `hair-${style}-${c}`;
if (stage === "shapes") {
  await run(Object.entries(styles).map(([s, d]) => ({ name: hairName(s, 1), from: master, prompt: `Give the bald puppet ${d} in dark brown yarn.` })));
}
if (stage === "colors") {
  await run(
    Object.keys(styles).flatMap((s) =>
      colors.flatMap((c, ci) =>
        ci === 1 ? [] : [{ name: hairName(s, ci), from: f(hairName(s, 1)), prompt: `Change only the colour of the yarn hair to ${c}; keep the exact hairstyle and shape.` }],
      ),
    ),
  );
}
if (stage === "faces") {
  const bases = [{ id: "bald", from: master }, ...Object.keys(styles).flatMap((s) => colors.map((_, ci) => ({ id: `${s}-${ci}`, from: f(hairName(s, ci)) })))];
  await run(
    bases.flatMap((b) =>
      skins.flatMap((skin, si) =>
        skin
          ? [{
              name: `face-${si}-${b.id}`,
              from: b.from,
              prompt: `Change only the felt skin colour of the head, ears, nose and neck to ${skin} felt; the nose stays the same colour as the skin. Keep the hair exactly as it is.`,
            }]
          : [],
      ),
    ),
  );
}
if (stage === "layers") {
  await run([
    ...["bald", ...Object.keys(styles)].flatMap((s) =>
      Object.entries(hats).map(([h, d]) => ({
        name: `hat-${s}-${h}`,
        from: s === "bald" ? master : f(hairName(s, 1)),
        prompt: `Put ${d} on the puppet's head, sitting naturally over the hair.`,
      })),
    ),
    ...Object.entries(scarves).map(([hex, c]) => ({ name: `scarf-${hex}`, from: master, prompt: `Wrap a chunky knitted ${c} wool scarf around the puppet's neck, over the sweater collar, with one end hanging down the front.` })),
    { name: "glasses", from: master, prompt: "Put a pair of large round thin dark-brown wire glasses on the puppet, centred over the eyes." },
  ]);
}
