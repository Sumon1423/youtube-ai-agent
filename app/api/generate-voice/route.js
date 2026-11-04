import { NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(req) {
  try {
    const body = await req.json();
    const { script, voiceId } = body;

    if (!script) {
      return NextResponse.json({ success: false, error: 'Script text is required.' }, { status: 400 });
    }

    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    if (!elevenLabsApiKey) {
      return NextResponse.json({ success: false, error: 'ELEVENLABS_API_KEY is missing in environment variables.' }, { status: 500 });
    }

    // ডিফল্ট ভয়েস আইডি হিসেবে ইলেভেন ল্যাবসের জনপ্রিয় ডিপ মেইল ভয়েস (যেমন: Adam বা Antony) ব্যবহার করা যেতে পারে
    const targetVoiceId = voiceId || '21m00Tcm4TlvDq8ikWAM'; // Adam voice id

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${targetVoiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': elevenLabsApiKey,
      },
      body: JSON.stringify({
        text: script,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.75, // সাসপেন্সফুল টোনের জন্য স্ট্যাবিলিটি বাড়ানো
          similarity_boost: 0.85,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ success: false, error: `ElevenLabs API error: ${errText}` }, { status: response.status });
    }

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');

    return NextResponse.json({
      success: true,
      audio: `data:audio/mp3;base64,${base64Audio}`,
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message || 'Voice generation failed.' }, { status: 500 });
  }
}
