import { NextResponse } from 'next/server';

export const maxDuration = 60; // ভয়েস জেনারেশনের জন্য টাইমআউট বাড়ানো হলো

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

    // কার্টেসিয়া এআই এপিআই কল (Sonic মডেল)
    const response = await fetch('https://api.cartesia.ai/tts/bytes', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cartesiaApiKey}`,
        'Cartesia-Version': '2024-06-10',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model_id: 'sonic-english', // True Crime এর জন্য পারফেক্ট ইংলিশ ভয়েস মডেল
        transcript: script,
        voice: {
          mode: 'id',
          id: voiceId || 'a0e99841-438c-4a64-b679-ae501e7d6091', // ডিফল্ট হাই-কোয়ালিটি ন্যারেশন ভয়েস আইডি
        },
        output_format: {
          container: 'mp3',
          encoding: 'mp3',
          sample_rate: 44100,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ success: false, error: `Cartesia API error: ${errText}` }, { status: response.status });
    }

    // অডিও বাইটগুলো রিসিভ করে বেসড টেন (Base64) বা সরাসরি অডিও স্ট্রিম হিসেবে পাঠানো
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
