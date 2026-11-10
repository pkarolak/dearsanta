// Generates the elf portraits as finished images, one per look, skin and hat, so nothing has to be cut out and stacked.
// Every image is an edit of the previous step (master -> look -> skin -> hat), which keeps framing identical across the set.
// Run from design/tools: node elves.mjs looks|skins|hats [only-look-ids...]   (reads FAL_KEY from ../../.env.local)
import { mkdir, readFile, writeFile } from "node:fs/promises";

const root = new URL("../../", import.meta.url).pathname;
const env = await readFile(`${root}.env.local`, "utf8");
const key = /^FAL_KEY=(.+)$/m.exec(env)?.[1].trim();
if (!key) throw new Error("FAL_KEY missing in .env.local");

const MODEL = "fal-ai/nano-banana/edit";
const headers = { Authorization: `Key ${key}`, "Content-Type": "application/json" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const out = `${root}design/elves`;
const KEEP =
  "Keep everything else exactly the same: same puppet head shape, same eyes, same nose and the same wide open mouth with the tongue, " +
  "same head size and position, same framing, same plain light grey knitted sweater, same lighting and the same plain light grey background. " +
  "Felt and yarn textures, handmade Muppet puppet style, photographed in a studio.";

async function edit(name, image, prompt) {
  const data = await readFile(image);
  const res = await fetch(`https://queue.fal.run/${MODEL}`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      prompt: `${prompt} ${KEEP}`,
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
  await writeFile(`${out}/${name}.png`, Buffer.from(await (await fetch(url)).arrayBuffer()));
  console.log(name, "saved");
}

const lashes = "three thick curved black felt eyelashes on top of each eye";
// Ids match src/lib/avatar.ts.
export const looks = {
  waves: `Give the puppet long wavy chestnut-brown yarn hair with a side parting, falling over the shoulders, ${lashes}, and a subtle thin rosy pink felt lip line on the edge of the open mouth.`,
  braids: `Give the puppet golden blonde yarn hair in two long thick plaits hanging in front of the shoulders, tied with small red ribbons, ${lashes}, and light freckles on the cheeks.`,
  bob: `Give the puppet a sleek glossy black yarn bob cut at chin length with a short straight fringe, ${lashes}, and small gold stud earrings.`,
  puffs: `Give the puppet dark brown tightly curled yarn hair in two big round afro puffs on top of the head, ${lashes}, and small gold hoop earrings.`,
  ponytail: `Give the puppet smooth thick bright copper-ginger yarn hair neatly combed back into a high full ponytail tied with a green band, the ponytail falling behind one shoulder, no loose strands, ${lashes}, and freckles across the nose.`,
  granny: `Make the puppet a sweet grandmother: short soft silver-white curly yarn hair in a neat perm, ${lashes}, small pearl earrings and a few gentle smile lines.`,
  pixie: `Give the puppet a short choppy pastel-pink yarn pixie cut, ${lashes}, and a tiny silver nose stud.`,
  bun: `Give the puppet smooth thick dark brown yarn hair neatly pulled up into a big round tidy bun on top of the head, no loose strands, ${lashes}, and small gold stud earrings.`,
  short: "Give the puppet short neat dark brown yarn hair and thick dark eyebrows. Clean-shaven: no beard, no moustache.",
  slick: "Give the puppet black yarn hair slicked back with a sharp side parting and thick black eyebrows. Clean-shaven: no beard, no moustache.",
  tousled: "Give the puppet messy tousled golden blond yarn hair and thick blond eyebrows. Clean-shaven: no beard, no moustache.",
  grandpa: "Give the puppet two fluffy white yarn hair puffs on the sides of the head above the ears, and fluffy white yarn eyebrows. The crown of the head stays plain felt.",
  curls: "Give the puppet short tight black curly yarn hair and thick black eyebrows. Clean-shaven: no beard, no moustache.",
  quiff: "Give the puppet bright ginger yarn hair brushed up high at the front, and ginger yarn eyebrows. No facial hair.",
  manbun: "Give the puppet dark brown yarn hair combed back neatly and tied into a small round man bun on top of the head, with no hair hanging down, and thick dark eyebrows. Clean-shaven: no beard, no moustache.",
};

// Index 1 is the master's own felt colour.
const skins = ["very light pale rosy peach", null, "light tan golden-brown", "medium warm brown", "deep dark brown"];
const hats = {
  santa: "a red felt Santa hat with a fluffy white trim and a white pompom flopping to the side",
  elf: "a tall pointy green felt elf hat with a red zigzag brim and a small gold bell at the tip, curling to the side",
  beanie: "a red knitted beanie with two cream stripes and a cream pompom on top",
  antlers: "a headband with two brown felt reindeer antlers",
};

const master = `${root}design/src/avatar-master.jpg`;
const f = (name) => `${out}/${name}.png`;
const exists = async (file) => !!(await readFile(file).catch(() => null));

/** Runs jobs at most `n` at a time, skipping any whose output already exists. */
async function run(jobs, n = 10) {
  const todo = [];
  for (const j of jobs) if (!(await exists(f(j.name)))) todo.push(j);
  console.log(`${todo.length} of ${jobs.length} to generate`);
  let i = 0;
  const failed = [];
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (i < todo.length) {
        const j = todo[i++];
        await edit(j.name, j.from, j.prompt).catch((e) => failed.push(`${j.name}: ${e.message.slice(0, 160)}`));
      }
    }),
  );
  if (failed.length) console.log("FAILED\n" + failed.join("\n"));
}

const stage = process.argv[2];
const only = process.argv.slice(3);
const ids = Object.keys(looks).filter((id) => !only.length || only.includes(id));
const name = (look, skin, hat = "none") => `${look}-${skin}-${hat}`;

if (stage === "looks") await run(ids.map((id) => ({ name: name(id, 1), from: master, prompt: looks[id] })));
if (stage === "skins")
  await run(
    ids.flatMap((id) =>
      skins.flatMap((skin, si) =>
        skin
          ? [{
              name: name(id, si),
              from: f(name(id, 1)),
              prompt: `Change only the felt skin colour of the face, head, ears, nose and neck to ${skin} felt; the nose stays the same colour as the skin. Keep the hair, eyelashes, beard, lips and earrings exactly as they are.`,
            }]
          : [],
      ),
    ),
  );
if (stage === "hats")
  await run(
    ids.flatMap((id) =>
      skins.flatMap((_, si) =>
        Object.entries(hats).map(([hat, d]) => ({
          name: name(id, si, hat),
          from: f(name(id, si)),
          prompt: `Put ${d} on the puppet's head, sitting naturally over the hair. Keep the face, hair colour, eyelashes, beard and skin colour exactly as they are.`,
        })),
      ),
    ),
  );
// The content checker keeps refusing a hairless grandfather from scratch; shaving the bearded one goes through.
if (stage === "shave")
  await run([{ name: name("grandpa", 1), from: `${out}/old/grandpa-1-none.png`, prompt: "Remove the white beard and moustache completely so the felt chin and cheeks show around the open mouth. Keep the white hair tufts above the ears and the bushy white eyebrows." }]);

// Facial hair is a layer: drawn once per hairstyle in its hair colour on the skin-1 portrait, then cut out by build-elves.mjs.
export const hairColour = {
  waves: "chestnut brown", braids: "golden blonde", bob: "black", puffs: "dark brown", ponytail: "copper ginger", granny: "silver white",
  pixie: "pastel pink", bun: "dark brown", short: "dark brown", slick: "black", tousled: "golden blond", grandpa: "white",
  curls: "black", quiff: "bright ginger", manbun: "dark brown",
};
const facial = {
  moustache: (c) => `a big curly ${c} yarn handlebar moustache above the open mouth`,
  goatee: (c) => `a short neat ${c} yarn goatee on the chin under the open mouth`,
  beard: (c) => `a full thick ${c} yarn beard along the jaw and chin around the open mouth, joined to a ${c} yarn moustache`,
};
if (stage === "beards")
  await run(
    ids.flatMap((id) =>
      Object.entries(facial).map(([kind, d]) => ({
        name: `${id}-1-${kind}`,
        from: f(name(id, 1)),
        prompt: `Give the puppet ${d(hairColour[id])}. The mouth stays wide open and fully visible. Keep the hair, eyelashes, earrings and skin exactly as they are.`,
      })),
    ),
  );
if (stage === "glasses")
  await run(
    ids.map((id) => ({
      name: `${id}-1-glasses`,
      from: f(name(id, 1)),
      prompt: "Put a pair of large round thin dark-brown wire glasses on the puppet, centred over the eyes, the arms going back to the ears. Keep the hair, eyelashes, earrings and skin exactly as they are.",
    })),
  );
