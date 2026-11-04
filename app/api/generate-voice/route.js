import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { text, voiceId } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'Script text is required for voice generation' }, { status: 400 });
    }

    // Cartesia AI API Integration for True Crime Narration
    const CARTESIA_API_KEY = process.env.CARTESIA_API_KEY;
    if (!CARTESIA_API_KEY) {
      return NextResponse.json({ error: 'Cartesia API Key is missing in environment variables.' }, { status: 500 });
    }

    // Default Cartesia Voice ID for deep narration (you can update or select via frontend)
    const selectedVoiceId = voiceId || 'a0e99841-438c-4a64-b679-ae501e7d6091'; 

    const response = await fetch('https://api.cartesia.ai/tts/bytes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': CARTESIA_API_KEY,
        'Cartesia-Version': '2024-06-10'
      },
      body: JSON.stringify({
        model_id: 'sonic-english',
        transcript: text,
        voice: {
          mode: 'id',
          id: selectedVoiceId
        },
        output_format: {
          container: 'mp3',
          encoding: 'mp3',
          sample_rate: 44100
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json({ error: errorData.message || 'Cartesia AI voice generation failed' }, { status: 500 });
    }

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');
    const audioUrl = `data:audio/mp3;base64,${base64Audio}`;

    return NextResponse.json({ success: true, audioUrl: audioUrl });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
