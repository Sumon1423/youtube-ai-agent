import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { title } = await req.json();

    if (!title) {
      return NextResponse.json({ error: 'Video title is required' }, { status: 400 });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    if (!geminiApiKey) {
      return NextResponse.json({ 
        error: 'GEMINI_API_KEY is missing in Vercel Environment Variables.' 
      }, { status: 500 });
    }

    const promptText = `You are an expert YouTube True Crime scriptwriter for viral US Shorts (50-60s). Write a tense, high-retention script with [Visual/B-Roll Cues] included for the topic: "${title}".`;

    // Using gemini-1.5-flash with v1beta endpoint which supports generateContent natively
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;

    const geminiResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: promptText }]
          }
        ]
      })
    });

    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
      return NextResponse.json({ error: data.error?.message || 'Gemini AI generation failed' }, { status: geminiResponse.status });
    }

    const generatedScript = data.candidates?.[0]?.content?.parts?.[0]?.text || "Script generation failed.";

    return NextResponse.json({ success: true, script: generatedScript });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
