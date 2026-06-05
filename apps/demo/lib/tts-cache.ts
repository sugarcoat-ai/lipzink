import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

/** ElevenLabs `/with-timestamps` JSON stored under `data/tts-cache/`. */
export type CachedTtsResponse = {
  audio_base64: string;
  alignment: {
    characters: string[];
    character_start_times_seconds: number[];
    character_end_times_seconds: number[];
  } | null;
  normalized_alignment?: CachedTtsResponse["alignment"];
};

export function ttsCacheKey(text: string, voiceId: string): string {
  return createHash("sha256")
    .update(`${voiceId}\n${text}`)
    .digest("hex")
    .slice(0, 16);
}

export async function readTtsCache(
  key: string,
): Promise<CachedTtsResponse | null> {
  try {
    const file = path.join(process.cwd(), "data/tts-cache", `${key}.json`);
    const raw = await readFile(file, "utf8");
    return JSON.parse(raw) as CachedTtsResponse;
  } catch {
    return null;
  }
}
