
import { NextResponse } from 'next/server';

const API_BASE =
  'https://generativelanguage.googleapis.com/v1beta';

const PREFERRED_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash-lite',
];

async function getAvailableModels(apiKey) {
  const response = await fetch(`${API_BASE}/models`, {
    method: 'GET',
    headers: {
      'x-goog-api-key': apiKey,
    },
    cache: 'no-store',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error?.message || 'Unable to fetch Gemini models.'
    );
  }

  const models = (data.models || []).filter((model) =>
    model.supportedGenerationMethods?.includes('generateContent')
  );

  if (!models.length) {
    throw new Error(
      'No Gemini models supporting generateContent are available.'
    );
  }

  const availableNames = models.map((model) =>
    model.name.replace(/^models\//, '')
  );

  const preferred = PREFERRED_MODELS.filter((name =>
    availableNames.includes(name)
  ));

  // Prefer current Flash models. If none match the preferred list,
  // select another available Flash model.
  const otherFlashModels = availableNames.filter((name) =>
    /flash/i.test(name) && !preferred.includes(name)
  );

  const selectedModels = [
    ...preferred,
    ...otherFlashModels,
  ];

  if (!selectedModels.length) {
    throw new Error(
      'No available Gemini Flash model supports generateContent.'
    );
  }

  return [...new Set(selectedModels)];
}

async function generateWithModel(apiKey, model, promptText) {
  const response = await fetch(
    `${API_BASE}/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: promptText,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 8192,
        },
      }),
      cache: 'no-store',
    }
  );

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(
      data.error?.message || `Gemini API error: ${response.status}`
    );

    error.status = response.status;
    throw error;
  }

  const script = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || '')
    .join('')
    .trim();

  if (!script) {
    const reason = data.candidates?.[0]?.finishReason;

    throw new Error(
      reason
        ? `Gemini returned no script. Finish reason: ${reason}`
        : 'Gemini returned an empty script.'
    );
  }

  return script;
}

export async function POST(req) {
  try {
    const body = await req.json();

    const title =
      typeof body?.title === 'string'
        ? body.title.trim()
        : '';

    if (!title) {
      return NextResponse.json(
        { error: 'Video title is required.' },
        { status: 400 }
      );
    }

    if (title.length > 500) {
      return NextResponse.json(
        { error: 'Video title must be 500 characters or less.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            'GEMINI_API_KEY is missing in Vercel environment variables.',
        },
        { status: 500 }
      );
    }

    const promptText = `
You are an expert YouTube True Crime scriptwriter.

Create a high-retention YouTube Shorts script for a United States audience.

VIDEO TITLE:
"${title}"

REQUIREMENTS:
- Target duration: 50-60 seconds.
- Write natural American English.
- Start with a compelling hook in the first 1-3 seconds.
- Keep the story tense, engaging, and easy to understand.
- Use short sentences suitable for narration.
- Include scene-by-scene [Visual/B-Roll Cues].
- Include narration for each scene.
- Build curiosity without misleading the audience.
- Do not invent facts about real crimes or real people.
- If the title concerns a real case, distinguish verified facts from uncertainty.
- End with a memorable conclusion or question.
- Do not include unnecessary introductions or explanations.

OUTPUT FORMAT:

TITLE:
[Short video title]

HOOK:
[Narration]

SCENE 1:
[Visual/B-Roll Cue]
[Narration]

SCENE 2:
[Visual/B-Roll Cue]
[Narration]

SCENE 3:
[Visual/B-Roll Cue]
[Narration]

SCENE 4:
[Visual/B-Roll Cue]
[Narration]

ENDING:
[Narration]

Keep the complete script suitable for a 50-60 second Short.
`;

    const models = await getAvailableModels(apiKey);

    let lastError;

    for (const model of models) {
      try {
        const script = await generateWithModel(
          apiKey,
          model,
          promptText
        );

        return NextResponse.json({
          success: true,
          script,
          model,
        });
      } catch (error) {
        lastError = error;

        // Try the next model if this one is unavailable
        // or does not support the requested generation.
        if (
          error.status === 404 ||
          error.status === 400
        ) {
          continue;
        }

        // Authentication, quota, and server errors should
        // not be hidden by repeatedly trying other models.
        throw error;
      }
    }

    throw new Error(
      `All available Gemini models failed. ${
        lastError?.message || ''
      }`
    );
  } catch (error) {
    console.error('Script generation error:', error);

    return NextResponse.json(
      {
        success: false,
        error:
          error.message || 'Gemini AI script generation failed.',
      },
      {
        status: error.status || 500,
      }
    );
  }
}
