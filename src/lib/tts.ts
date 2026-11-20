import { createHash } from "node:crypto";
import { getTtsLine, hasTtsAudio, registerTtsLines, storeTtsAudio, ttsAudioSizes } from "@/lib/db/repo";

/** ElevenLabs premade voice "Bill" – a warm, older male narrator. Override with ELEVENLABS_VOICE_ID. */
const DEFAULT_VOICE = "pqHfZKP75CvOlQylNhV4";
const RETRY_AFTER_FAILURE_MS = 1000 * 60 * 10;

export interface TtsProvider {
  readonly voice: string;
  synthesize(text: string, lang: string): Promise<{ audio: Buffer; mime: string }>;
}

class ElevenLabsProvider implements TtsProvider {
  constructor(
    private readonly apiKey: string,
    readonly voice: string,
    private readonly model: string,
  ) {}

  async synthesize(text: string, lang: string) {
    // A Voice Library voice is added to the account on first use; parallel first calls get 409 until that's done.
    for (let attempt = 1; ; attempt++) {
      const res = await this.request(text, lang);
      if (res.ok) return { audio: Buffer.from(await res.arrayBuffer()), mime: "audio/mpeg" };
      const retry = res.status === 409 || res.status === 429 || res.status >= 500;
      if (!retry || attempt === 5) throw new Error(`ElevenLabs ${res.status}: ${(await res.text()).slice(0, 200)}`);
      await new Promise((r) => setTimeout(r, 1200 * attempt + Math.random() * 800));
    }
  }

  private request(text: string, lang: string) {
    return fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${this.voice}?output_format=mp3_44100_64`,
      {
        method: "POST",
        headers: { "xi-api-key": this.apiKey, "content-type": "application/json", accept: "audio/mpeg" },
        body: JSON.stringify({
          text,
          model_id: this.model,
          language_code: this.model.includes("multilingual_v2") ? undefined : lang,
          voice_settings: { stability: 0.55, similarity_boost: 0.75, style: 0.35, use_speaker_boost: true },
        }),
      },
    );
  }
}

let provider: TtsProvider | null | undefined;

export function ttsProvider(): TtsProvider | null {
  if (provider !== undefined) return provider;
  const key = process.env.ELEVENLABS_API_KEY;
  provider = key
    ? new ElevenLabsProvider(
        key,
        process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE,
        process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2",
      )
    : null;
  return provider;
}

const hashLine = (text: string, lang: string, voice: string) =>
  createHash("sha256").update(`${voice}|${lang}|${text}`).digest("hex").slice(0, 40);

/**
 * Registers a line the server itself composed and returns its audio URL. Only registered lines
 * can be synthesized, so the endpoint cannot be abused to spend the TTS quota on arbitrary text.
 */
export async function prepareLine(text: string, lang: string): Promise<string | null> {
  const urls = await prepareLines([{ key: "line", text, lang }]);
  return urls.line ?? null;
}

/** Registers many fixed lines in one write and returns `/api/tts/…` urls. Null when no voice provider is configured. */
export async function prepareLines(items: { key: string; text: string; lang: string }[]): Promise<Record<string, string | null>> {
  const p = ttsProvider();
  if (!p) return Object.fromEntries(items.map((item) => [item.key, null]));
  const rows = items.map((item) => ({
    key: item.key,
    hash: hashLine(item.text, item.lang, p.voice),
    text: item.text,
    lang: item.lang,
    voice: p.voice,
  }));
  await registerTtsLines(rows);
  return Object.fromEntries(rows.map((row) => [row.key, `/api/tts/${row.hash}`]));
}

export async function audioForHash(hash: string) {
  const line = await getTtsLine(hash);
  if (!line) return null;
  if (line.audio) return { audio: line.audio, mime: line.mime ?? "audio/mpeg" };
  const p = ttsProvider();
  if (!p) return null;
  if (line.failedAt && Date.now() - line.failedAt.getTime() < RETRY_AFTER_FAILURE_MS) return null;
  try {
    const result = await p.synthesize(line.text, line.lang);
    await storeTtsAudio(hash, result.audio, result.mime);
    return result;
  } catch (error) {
    console.error("[tts]", error);
    await storeTtsAudio(hash, null, null);
    return null;
  }
}

/** The audio URL of a line only if it is already recorded, so playing it needs no internet. */
export async function recordedLine(text: string, lang: string): Promise<string | null> {
  const p = ttsProvider();
  if (!p) return null;
  const hash = hashLine(text, lang, p.voice);
  return (await hasTtsAudio(hash)) ? `/api/tts/${hash}` : null;
}

/** Records lines now, one by one, and reports which of them have audio. */
export async function recordLines(texts: string[], lang: string) {
  const results: { text: string; ok: boolean }[] = [];
  for (const text of texts) {
    const url = await prepareLine(text, lang);
    const audio = url ? await audioForHash(url.split("/").pop()!) : null;
    results.push({ text, ok: !!audio });
  }
  return results;
}

/** Recordings are constant 64 kbit/s MP3 (see the request above), so their length follows from their size. */
const BYTES_PER_SECOND = 64_000 / 8;

/** How long each recorded line lasts, in seconds, by audio URL; lines not recorded yet are missing. */
export async function recordedSeconds(urls: string[]) {
  const sizes = await ttsAudioSizes(urls.map((u) => u.split("/").pop()!));
  return new Map(urls.flatMap((u) => {
    const size = sizes.get(u.split("/").pop()!);
    return size ? [[u, size / BYTES_PER_SECOND] as const] : [];
  }));
}

const warming = new Set<string>();

/** Synthesizes lines in the background, so the audio is ready by the time a device asks for it. */
export function warmLines(urls: (string | null)[]) {
  for (const url of urls) {
    const hash = url?.split("/").pop();
    if (!hash || warming.has(hash)) continue;
    warming.add(hash);
    void audioForHash(hash)
      .catch(() => null)
      .finally(() => warming.delete(hash));
  }
}
