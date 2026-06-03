// ElevenLabs text-to-speech proxy.
//
// Keeps the API key server-side and streams the MP3 back to the browser, which
// pipes it through a Web Audio analyser to drive the avatar's mouth.
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

  const upstream = await fetch(`${ELEVENLABS_URL}/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: modelId,
      voice_settings: { stability: 0.4, similarity_boost: 0.7 },
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => "");
    return Response.json(
      { error: `ElevenLabs request failed (${upstream.status})`, detail },
      { status: 502 },
    );
  }

  // Stream the audio straight through to the client.
  return new Response(upstream.body, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
