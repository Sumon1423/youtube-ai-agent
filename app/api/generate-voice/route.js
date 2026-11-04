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

    // Cartesia API Call with latest stable configurations
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
          id: voiceId || '694f9389-aac1-45b6-b726-9d9369183238',
        },
        output_format: {
          container: 'mp3',
          encoding: 'mp3',
          sample_rate: 44100,
        },
      }),
    });

    const responseText = await response.text();

    if (!response.ok) {
      return NextResponse.json({ 
        success: false, 
        error: `Cartesia Error: ${responseText}` 
      }, { status: response.status });
    }

    // Convert array buffer to base64
    const audioBuffer = Buffer.from(responseText, 'binary');
    const base64Audio = audioBuffer.toString('base64');

    return NextResponse.json({
      success: true,
      audio: `data:audio/mp3;base64,${base64Audio}`,
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message || 'Voice generation failed.' }, { status: 500 });
  }
}
