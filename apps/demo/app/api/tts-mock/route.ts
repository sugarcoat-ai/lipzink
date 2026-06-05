// Cached TTS for the public demo — no ElevenLabs calls, no API key.
//
// Responses live in `data/tts-cache/{key}.json` (key = hash of voiceId + text).
// Refresh a clip with:
//   curl 'https://www.lipz.ink/api/tts' -H 'content-type: application/json' \
//     --data '{"text":"…","voiceId":"…"}' \
//     -o apps/demo/data/tts-cache/$(node -e "…").json

import { readTtsCache, ttsCacheKey } from "@/lib/tts-cache";

type TtsBody = {
  text?: string;
  voiceId?: string;
};

export async function POST(request: Request) {
  let body: TtsBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const text = body.text?.trim();
  if (!text) {
    return Response.json({ error: "Missing `text`." }, { status: 400 });
  }

  const voiceId = body.voiceId || "21m00Tcm4TlvDq8ikWAM";
  const key = ttsCacheKey(text, voiceId);
  const cached = await readTtsCache(key);

  if (!cached) {
    return Response.json(
      {
        error:
          "No cached clip for this text/voice. The demo ships with the default pangram only.",
      },
      { status: 404 },
    );
  }

  return Response.json(cached, {
    headers: { "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
