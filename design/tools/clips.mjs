// Generates the landing film's video clips with Kling 3.0 on fal.ai from the keyframes in design/src.
// Run from design/tools: node clips.mjs <clip id> [<clip id> ...]   (reads FAL_KEY from ../../.env.local)
import { mkdir, readFile, writeFile } from "node:fs/promises";

const root = new URL("../../", import.meta.url).pathname;
const env = await readFile(`${root}.env.local`, "utf8");
const key = /^FAL_KEY=(.+)$/m.exec(env)?.[1].trim();
if (!key) throw new Error("FAL_KEY missing in .env.local");

const MODEL = "fal-ai/kling-video/v3/standard/image-to-video";
const STYLE =
  "Stop-motion style Muppet puppet animation, handmade felt puppets with natural arm, leg and head movement, puppet mouths flapping, " +
  "warm 1970s Christmas TV special look, consistent felt and wood textures, steady cinematic camera.";
const NEGATIVE = "blur, distort, low quality, morphing, extra limbs, extra characters, text, letters, subtitles, cigarette, smoking";

/** Every clip the film needs: its keyframe, how long it runs, and what happens in it. */
export const clips = {
  village: {
    image: "key-village.jpg",
    end: "key-home.jpg",
    duration: 13,
    prompt:
      "Snow falls gently over the felt miniature village at night, the northern lights ripple, smoke curls up from the manor's chimneys, " +
      "the strings of coloured bulbs twinkle and the windows glow; in front of the manor the three cheerful elf puppets decorate the big " +
      "Christmas tree: one on the ladder sets the golden star on top, one hangs baubles, one wraps the lights, which light up. The camera first holds " +
      "on the whole village for a few seconds, then glides slowly towards Santa's grand manor in the centre and pushes in through its big glowing window above the porch, arriving inside the " +
      "cosy living room where Santa sits in his armchair under a pile of letters.",
  },
  home: {
    image: "key-home.jpg",
    duration: 8,
    prompt:
      "Santa puppet sighs heavily and talks to himself with his mouth flapping, rubs his forehead with his mitten, then lifts the long list " +
      "and lets it flop down again. More letters flutter down from above and land on him and around the armchair. " +
      "The fire crackles, the tree bulbs twinkle. Slow gentle camera push-in.",
  },
  walkWorkshop: {
    image: "key-village.jpg",
    end: "key-workshop.jpg",
    duration: 5,
    prompt:
      "Snow falls over the felt village at night, bulbs twinkle, chimney smoke curls, elves decorate the Christmas tree. The camera turns away from the manor and travels left " +
      "across the snow, past the toy soldier and the rocking horse, to the small wooden elves' workshop on the left, and flies in through its " +
      "round-topped door into the warm workshop interior full of goofing elf puppets.",
  },
  workshop: {
    image: "key-workshop.jpg",
    duration: 10,
    prompt:
      "The three elf puppets goof around instead of working. The middle elf kicks his legs and slides forward on the little red sled. " +
      "The right elf juggles the toy blocks, drops one and giggles. Fire crackles, the tree bulbs twinkle, candle flames flicker. " +
      "At the end the left elf turns to face the camera, winds up and throws the snowball straight at the camera; the snowball flies towards " +
      "the lens, grows huge and splats onto the lens, covering the whole frame in white snow.",
  },
  walkStable: {
    image: "key-village.jpg",
    end: "key-stable.jpg",
    duration: 6,
    prompt:
      "Snow falls over the felt village at night, bulbs twinkle, smoke curls from the manor's chimneys. The camera travels right along the " +
      "snowy square, past the elves decorating the Christmas tree, to the wooden reindeer stable, and glides in through its open front " +
      "into the lantern-lit stable interior where the reindeer puppet waits.",
  },
  stable: {
    image: "key-stable.jpg",
    duration: 10,
    prompt:
      "The reindeer puppet with a cold sniffles, tilts its head back, 'ah... ah... ah...' and lets out a huge comical sneeze that blows hay " +
      "into the air and makes the harness bells swing; it wipes its red nose with the tissue. Then the camera pans right to the old red sleigh, " +
      "which creaks and wobbles on its crooked runner while a loose patch plank pops off and falls to the floor. Lanterns flicker.",
  },
  factory: {
    image: "key-factory.jpg",
    duration: 8,
    prompt:
      "The conveyor belt runs and carries the wrapped presents from right to left while the two elf puppets wrap gifts. Suddenly the belt " +
      "jerks and grinds to a halt, the machines sputter, puff grey smoke and spit sparks, the presents pile up and tumble off the belt, " +
      "and the two elves throw their arms up in panic. The bulbs flicker.",
  },
  santa: {
    image: "key-santa.jpg",
    duration: 5,
    prompt:
      "Santa puppet leans towards the camera and speaks warmly and earnestly with his mouth moving, gesturing gently with his clasped mittens, " +
      "a hopeful look. The fire flickers, the tree bulbs glow softly. Very slow camera push-in.",
  },
  finaleReveal: {
    image: "key-curtain.jpg",
    end: "key-finale.jpg",
    duration: 7,
    prompt:
      "The footlights glow, the velvet stage curtains part and sweep open to the sides, revealing Santa in the centre with five people puppets " +
      "in Christmas sweaters around him; magical golden sparkles swirl around them and pointy elf hats with bells and pointy felt elf ears " +
      "appear on their heads. They look delighted, jump for joy and Santa throws his arms up laughing as confetti bursts.",
  },
  finaleParty: {
    image: "key-finale.jpg",
    end: "key-finale.jpg",
    duration: 6,
    prompt:
      "A joyful party that never stops moving: Santa laughs heartily, dances a little jig, claps and pumps his arms in the air; the new elves " +
      "jump, dance, spin, high-five and hug each other, one fires the party popper, everyone keeps cheering and bouncing the whole time. " +
      "Confetti and golden streamers keep falling, footlights and marquee bulbs twinkle. Locked-off camera.",
  },
};

/** Portrait (9:16) twins for phones: same clips from the `-v` keyframes, with prompts adjusted where the layout differs. */
const tallPrompts = {
  workshop:
    "The three elf puppets goof around instead of working. The elf on the little red sled kicks his legs and slides forward. " +
    "The elf at the back juggles the toy blocks, drops one and giggles. Fire crackles, the tree bulbs twinkle, candle flames flicker. " +
    "At the end the front elf turns to face the camera, winds up and throws the snowball straight at the camera; the snowball flies towards " +
    "the lens, grows huge and splats onto the lens, covering the whole frame in white snow.",
  stable:
    "The reindeer puppet with a cold sniffles, tilts its head back, 'ah... ah... ah...' and lets out a huge comical sneeze that blows hay " +
    "into the air and makes the lanterns swing; it wipes its red nose with the tissue. Then the camera pans right to the old red sleigh, " +
    "which creaks and wobbles while a loose patch plank pops off and falls to the floor. Lanterns flicker.",
  finaleReveal:
    "The footlights glow, the velvet stage curtains part and sweep open to the sides, revealing Santa in the centre with five people puppets " +
    "in Christmas sweaters around him; magical golden sparkles swirl around them and pointy elf hats with bells and pointy felt elf ears " +
    "appear on their heads. They look delighted, jump for joy and Santa throws his arms up laughing as confetti bursts.",
};
const tall = (name) => name.replace(/\.jpg$/, "-v.jpg");
for (const [id, clip] of Object.entries({ ...clips })) {
  clips[`${id}Tall`] = {
    ...clip,
    image: tall(clip.image),
    ...(clip.end ? { end: tall(clip.end) } : {}),
    prompt: tallPrompts[id] ?? clip.prompt,
  };
}

const headers = { Authorization: `Key ${key}`, "Content-Type": "application/json" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function generate(id) {
  const clip = clips[id];
  if (!clip) throw new Error(`Unknown clip ${id}`);
  const image = await readFile(`${root}design/src/${clip.image}`);
  const body = {
    prompt: `${STYLE} ${clip.prompt}`,
    start_image_url: `data:image/jpeg;base64,${image.toString("base64")}`,
    ...(clip.end ? { end_image_url: `data:image/jpeg;base64,${(await readFile(`${root}design/src/${clip.end}`)).toString("base64")}` } : {}),
    duration: String(clip.duration),
    generate_audio: false,
    negative_prompt: NEGATIVE,
  };
  const res = await fetch(`https://queue.fal.run/${MODEL}`, { method: "POST", headers, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`${id}: submit ${res.status} ${await res.text()}`);
  const { status_url, response_url } = await res.json();
  console.log(id, "queued");
  for (;;) {
    await sleep(8000);
    const s = await (await fetch(status_url, { headers })).json();
    if (s.status === "COMPLETED") break;
    if (s.status !== "IN_QUEUE" && s.status !== "IN_PROGRESS") throw new Error(`${id}: ${JSON.stringify(s)}`);
  }
  const out = await (await fetch(response_url, { headers })).json();
  if (!out.video?.url) throw new Error(`${id}: ${JSON.stringify(out)}`);
  await mkdir(`${root}design/clips`, { recursive: true });
  const file = `${root}design/clips/${id}-${Date.now()}.mp4`;
  await writeFile(file, Buffer.from(await (await fetch(out.video.url)).arrayBuffer()));
  console.log(id, "saved", file);
}

const ids = process.argv.slice(2);
await Promise.all(ids.map(generate));
