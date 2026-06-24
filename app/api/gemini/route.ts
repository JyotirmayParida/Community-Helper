import { NextRequest, NextResponse } from 'next/server';
import { runInsightAgent } from '@/lib/services/agents/insight';

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }
    const insights = await runInsightAgent(prompt);
    return NextResponse.json({ text: insights });
  } catch (error: any) {
    console.error('[Gemini API Route Error]', error);
    return NextResponse.json({ error: error?.message || 'Failed to generate insights' }, { status: 500 });
  }
}
