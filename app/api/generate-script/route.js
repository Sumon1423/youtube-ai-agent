import { NextResponse } from 'next/server';

export const maxDuration = 30; // Vercel-এ যেন টাইমআউট না হয়

export async function POST(req) {
  try {
    const body = await req.json();
    const title = body?.title?.trim();

    if (!title) {
      return NextResponse.json({ success: false, error: 'Video title is required.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'GEMINI_API_KEY is missing in Vercel environment variables.' }, { status: 500 });
    }

    const prompt = `You are an expert YouTube True Crime scriptwriter for US Shorts (50-60s). Write a high-retention script with [Visual/B-Roll Cues] included for the title: "${title}". Output format: TITLE, HOOK, SCENE 1-4, ENDING.`;

    // Gemini 1.5 Flash Stable Endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ 
        success: false, 
        error: data.error?.message || `Gemini API error: ${response.status}` 
      }, { status: response.status });
    }

    const script = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!script) {
      return NextResponse.json({ success: false, error: 'Gemini returned empty script.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, script });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message || 'Internal server error.' }, { status: 500 });
  }
}
