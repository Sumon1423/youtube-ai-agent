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

    // Cartesia Sonic API Payload
    const payload = {
      model_id: 'sonic',
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
    };

    let response = await fetch('https://api.cartesia.ai/tts/bytes', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cartesiaApiKey}`,
        'Cartesia-Version': '2024-06-10',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // যদি প্রথমবারে এরর দেয়, তবে মডেল নাম 'sonic-english' দিয়ে ফলব্যাক ট্রাই করবে
    if (!response.ok) {
      payload.model_id = 'sonic-english';
      response = await fetch('https://api.cartesia.ai/tts/bytes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cartesiaApiKey}`,
          'Cartesia-Version': '2024-06-10',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    }

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ 
        success: false, 
        error: `Cartesia API error: ${errText || response.statusText}` 
      }, { status: response.status });
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
