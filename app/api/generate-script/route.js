
import { NextResponse } from 'next/server';

const API_BASE =
  'https://generativelanguage.googleapis.com/v1beta';

const MAX_RETRIES = 2;

const PREFERRED_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash-lite',
];

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

function getRetryDelay(response, attempt) {
  const retryAfter = response?.headers?.get('retry-after');

  if (retryAfter) {
    const seconds = Number(retryAfter);

    if (Number.isFinite(seconds) && seconds > 0) {
      return Math.min(seconds * 1000, 15000);
    }
  }

  // Exponential backoff with jitter.
  const base = 1000 * Math.pow(2, attempt);

  return Math.min(base + Math.random() * 500, 10000);
}

function isTemporaryError(status) {
  return (
    status === 408 ||
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504
  );
}

async function fetchAvailableModels(apiKey) {
  const response = await fetch(`${API_BASE}/models`, {
    method: 'GET',
    headers: {
      'x-goog-api-key': apiKey,
    },
    cache: 'no-store',
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(
      data.error?.message || 'Unable to fetch Gemini models.'
    );

    error.status = response.status;
    throw error;
  }

  const availableModels = (data.models || [])
    .filter((model) =>
      model.supportedGenerationMethods?.includes(
        'generateContent'
      )
    )
    .map((model) =>
      model.name.replace(/^models\//, '')
    );

  const preferred = PREFERRED_MODELS.filter((name) =>
    availableModels.includes(name)
  );

  const otherFlashModels = availableModels.filter(
    (name) =>
      /flash/i.test(name) && !preferred.includes(name)
  );

  const selected = [
    ...preferred,
    ...otherFlashModels,
  ];

  if (!selected.length) {
    throw new Error(
      'No available Gemini Flash model supports generateContent.'
    );
  }

  return [...new Set(selected)];
}

async function callGemini(apiKey, model, prompt) {
  const url =
    `${API_BASE}/models/${model}:generateContent`;

  let lastError;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    let response;

    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 8192,
          },
        }),
        cache: 'no-store',
      });
    } catch (error) {
      // Network errors can be temporary.
      lastError = error;

      if (attempt < MAX_RETRIES) {
        await sleep(getRetryDelay(null, attempt));
        continue;
      }

      throw error;
    }

    const data = await response.json().catch(() => ({}));

    if (response.ok) {
      const script = data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || '')
        .join('')
        .trim();

      if (!script) {
        const finishReason =
          data.candidates?.[0]?.finishReason;

        throw new Error(
          finishReason
            ? `Gemini returned no script. Finish reason: ${finishReason}`
            : 'Gemini returned an empty script.'
        );
      }

      return script;
    }

    const error = new Error(
      data.error?.message ||
        `Gemini API returned HTTP ${response.status}`
    );

    error.status = response.status;
    lastError = error;

    // Retry temporary errors on the same model.
    if (
      isTemporaryError(response.status) &&
      attempt < MAX_RETRIES
    ) {
      await sleep(getRetryDelay(response, attempt));
      continue;
    }

    // Non-temporary errors should go to model fallback
    // without repeatedly calling the same model.
    throw error;
  }

  throw lastError || new Error('Gemini request failed.');
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
        {
          error:
            'Video title must be 500 characters or less.',
        },
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

    const prompt = `
You are an expert YouTube True Crime scriptwriter
for a United States audience.

VIDEO TITLE:
"${title}"

Create a high-retention YouTube Shorts script.

REQUIREMENTS:
- Target duration: 50-60 seconds.
- Write natural American English.
- Start with a strong hook in the first 1-3 seconds.
- Use short, clear narration sentences.
- Include scene-by-scene visual or B-roll cues.
- Build suspense without misleading the audience.
- Do not invent facts about real crimes or real people.
- Separate verified facts from uncertainty.
- End with a memorable conclusion or question.
- Keep the script suitable for Shorts.

OUTPUT FORMAT:

TITLE:
[Video title]

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

Return only the script.
`;

    const models = await fetchAvailableModels(apiKey);

    let lastError;

    for (const model of models) {
      try {
        const script = await callGemini(
          apiKey,
          model,
          prompt
        );

        return NextResponse.json({
          success: true,
          script,
          model,
        });
      } catch (error) {
        lastError = error;

        console.error(
          `Gemini model ${model} failed:`,
          error.message
        );

        // Try another model for:
        // model not found, unsupported model,
        // temporary server errors, or capacity errors.
        if (
          error.status === 400 ||
          error.status === 404 ||
          error.status === 429 ||
          error.status === 500 ||
          error.status === 502 ||
          error.status === 503 ||
          error.status === 504
        ) {
          continue;
        }

        // Authentication, permission, and other
        // non-recoverable errors should stop here.
        throw error;
      }
    }

    const status =
      lastError?.status === 429
        ? 429
        : lastError?.status === 503
          ? 503
          : 502;

    throw Object.assign(
      new Error(
        `All available Gemini models failed. ${
          lastError?.message || ''
        }`
      ),
      { status }
    );
  } catch (error) {
    console.error('Script generation error:', error);

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          'Gemini AI script generation failed.',
      },
      {
        status: error.status || 500,
      }
    );
  }
}
