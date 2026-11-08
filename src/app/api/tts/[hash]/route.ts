import { audioForHash } from "@/lib/tts";

export const maxDuration = 30;

export async function GET(_request: Request, { params }: { params: Promise<{ hash: string }> }) {
  const { hash } = await params;
  if (!/^[0-9a-f]{40}$/.test(hash)) return new Response(null, { status: 400 });
  const result = await audioForHash(hash);
  // 204 tells the player to fall back to the browser's speech synthesis.
  if (!result) return new Response(null, { status: 204 });
  return new Response(new Uint8Array(result.audio), {
    headers: {
      "content-type": result.mime,
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
