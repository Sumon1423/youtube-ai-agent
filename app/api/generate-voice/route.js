import { NextResponse } from 'next/server';
import { MsEdgeTTS, voices } from 'ms-edge-tts';

export const maxDuration = 60;

export async function POST(req) {
  try {
    const body = await req.json();
    const { script, voiceId } = body;

    if (!script) {
      return NextResponse.json({ success: false, error: 'Script text is required.' }, { status: 400 });
    }

    const tts = new MsEdgeTTS();
    // ট্রু ক্রাইমের জন্য গম্ভীর ও ডিপ ভয়েস যেমন en-US-ChristopherNeural বা ইউজার সিলেক্টেড ভয়েস
    const selectedVoice = voiceId || 'en-US-ChristopherNeural';
    
    await tts.setVoice(selectedVoice);

    // অডিও স্ট্রিম বা বাফার তৈরি করা
    const audioStream = await tts.toStream(script);
    const chunks = [];

    for await (const chunk of audioStream) {
      chunks.push(chunk);
    }

    const audioBuffer = Buffer.concat(chunks);
    const base64Audio = audioBuffer.toString('base64');

    return NextResponse.json({
      success: true,
      audio: `data:audio/mp3;base64,${base64Audio}`,
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message || 'Voice generation failed.' }, { status: 500 });
  }
}
