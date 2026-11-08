import { createHash } from "node:crypto";
import { getTtsLine, registerTtsLine, storeTtsAudio } from "@/lib/db/repo";

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
  const p = ttsProvider();
  if (!p) return null;
  const hash = hashLine(text, lang, p.voice);
  await registerTtsLine(hash, text, lang, p.voice);
  return `/api/tts/${hash}`;
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
