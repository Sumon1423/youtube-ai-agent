import { NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(req) {
  try {
    const body = await req.json();
    const { script, voiceId } = body;

    if (!script) {
      return NextResponse.json({ success: false, error: 'Script text is required.' }, { status: 400 });
    }

    const cartesiaApiKey = process.env.CARTESIA_API_KEY;
    if (!cartesiaApiKey) {
      return NextResponse.json({ success: false, error: 'CARTESIA_API_KEY is missing in environment variables.' }, { status: 500 });
    }

    // Using Cartesia's current stable sonic model
    const response = await fetch('https://api.cartesia.ai/tts/bytes', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cartesiaApiKey}`,
        'Cartesia-Version': '2024-06-10',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model_id: 'sonic-english', 
        transcript: script,
        voice: {
          mode: 'id',
          id: voiceId || 'a0e99841-438c-4a64-b679-ae501e7d6091',
        },
        output_format: {
          container: 'mp3',
          encoding: 'mp3',
          sample_rate: 44100,
        },
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json({ 
        success: false, 
        error: data.message || data.error || `Cartesia API error status ${response.status}` 
      }, { status: response.status });
    }

    // Since /tts/bytes returns binary buffer when successful
    // Let's handle it safely by checking response type or fallback
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
