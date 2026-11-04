import { NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(req) {
  try {
    const body = await req.json();
    const { script } = body;

    if (!script) {
      return NextResponse.json({ success: false, error: 'Script text is required.' }, { status: 400 });
    }

    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    if (!elevenLabsApiKey) {
      return NextResponse.json({ success: false, error: 'ELEVENLABS_API_KEY is missing in environment variables.' }, { status: 500 });
    }

    // স্ক্রিপ্ট থেকে হুক, এন্ডিং, সিন হেডিং এবং যেকোনো ব্র্যাকেট বা লেবেল সম্পূর্ণ বাদ দেওয়ার ফিল্টার
    const cleanScript = script
      .replace(/\[.*?\]/g, '') // থার্ড ব্র্যাকেটের ভেتরের সব রিমুভ
      .replace(/\(.*?\)/g, '') // ফার্স্ট ব্র্যাকেটের ভেতরের সব রিমুভ
      .replace(/^(Hook|Ending|Scene|Title|Intro|Outro|Narrator|Voiceover)[\s\:\-]*/gim, '') // হুক, এন্ডিং, সিন ইত্যাদি লেবেল রিমুভ
      .replace(/(Hook:|Ending:|Scene \d+:|Title:)/gi, '') // ডাবল প্রটেকশনের জন্য নির্দিষ্ট কিওয়ার্ড রিমুভ
      .trim();

    const safeVoiceId = 'EXAVITQu4vr4xnSDxMaL';

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${safeVoiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': elevenLabsApiKey,
      },
      body: JSON.stringify({
        text: cleanScript || script,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.75,
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
