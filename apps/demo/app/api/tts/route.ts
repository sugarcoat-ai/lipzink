// ElevenLabs text-to-speech proxy.
//
// Keeps the API key server-side and returns ElevenLabs' `/with-timestamps`
// JSON verbatim (base64 MP3 + character-level alignment). The browser turns the
// alignment into a scheduled cue timeline so the avatar's mouth lands on each
// phoneme on time instead of trailing the audio. See `fetchElevenLabsSpeech`
// in @lipzink/mouth, which consumes exactly this response.
//
// Requires ELEVENLABS_API_KEY in the environment (see .env.example).

const ELEVENLABS_URL = "https://api.elevenlabs.io/v1/text-to-speech";

type TtsBody = {
  text?: string;
  voiceId?: string;
  modelId?: string;
};

export async function POST(request: Request) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return Response.json(
      {
        error:
          "ELEVENLABS_API_KEY is not set. Add it to .env.local to enable TTS (see .env.example). You can still test the analyser with the microphone.",
      },
      { status: 501 },
    );
  }

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

  // Default to "Rachel"; the multilingual v2 model is a good general default.
  const voiceId = body.voiceId || "21m00Tcm4TlvDq8ikWAM";
  const modelId = body.modelId || "eleven_multilingual_v2";

  // `/with-timestamps` returns JSON: { audio_base64, alignment, normalized_alignment }.
  const upstream = await fetch(`${ELEVENLABS_URL}/${voiceId}/with-timestamps`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      text,
      model_id: modelId,
      voice_settings: { stability: 0.4, similarity_boost: 0.7 },
    }),
  });

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => "");
    return Response.json(
      { error: `ElevenLabs request failed (${upstream.status})`, detail },
      { status: 502 },
    );
  }

  // Pass the timestamped JSON straight through to the client.
  const data = await upstream.json();
  return Response.json(data, { headers: { "Cache-Control": "no-store" } });
}
