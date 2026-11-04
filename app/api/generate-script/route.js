import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { title } = await req.json();

    if (!title) {
      return NextResponse.json({ error: 'Video title is required' }, { status: 400 });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    if (!geminiApiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is missing in environment variables.' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const promptText = `You are an expert YouTube True Crime scriptwriter for viral US Shorts (50-60s). Write a tense, high-retention script with [Visual/B-Roll Cues] included for the topic: "${title}".`;

    const result = await model.generateContent(promptText);
    const response = await result.response;
    const generatedScript = response.text();

    return NextResponse.json({ success: true, script: generatedScript });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
