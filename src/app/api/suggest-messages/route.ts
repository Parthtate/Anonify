import { NextResponse } from 'next/server';
import { HfInference } from '@huggingface/inference';

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

export const runtime = 'edge';

const FALLBACK_SUGGESTIONS = [
  "What's a hobby you've recently started?",
  "If you could have dinner with any historical figure, who would it be?",
  "What's a simple thing that makes you happy?",
];

export async function POST(req: Request) {
  try {
    const randomSeed = Math.floor(Math.random() * 10000);
    const prompt = `Generate exactly 3 fun, open-ended, anonymous questions separated by "||". Do not number them. Example: What's a hobby you enjoy?||What country would you love to visit?||What skill do you wish you had? Now generate 3 questions (seed: ${randomSeed}):`;

    const response = await hf.textGeneration({
      model: 'google/flan-t5-base', // Changed model to google/flan-t5-base
      inputs: prompt,
      parameters: {
        max_new_tokens: 120, // Changed max_new_tokens
        return_full_text: false,
        temperature: 0.8, // Changed temperature
      },
    });

    const generatedText = response.generated_text.trim();

    // Extract the part with || separators, ignoring any preamble
    const match = generatedText.match(/([^|]+\|\|[^|]+\|\|[^|]+)/);
    if (!match) {
      return NextResponse.json({ suggestions: FALLBACK_SUGGESTIONS });
    }

    const suggestions = match[1]
      .split('||')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .slice(0, 3);

    if (suggestions.length < 2) {
      return NextResponse.json({ suggestions: FALLBACK_SUGGESTIONS });
    }

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Error fetching suggestions:', error); // Updated error message
    return NextResponse.json({ suggestions: FALLBACK_SUGGESTIONS }, { status: 200 });
  }
}