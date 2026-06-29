import { ai } from '../../gemini';

export async function runInsightAgent(prompt: string): Promise<string> {
  const systemInstruction = 'You are a municipal data analysis engine that outputs plain-text-only dashboard insights for citizens.';
  const userContent = `Analyze the following municipal report data and provide a predictive civic trend insight.

DATA SUMMARY:
${prompt}

STRICT CONSTRAINTS:
1. Output MUST be plain prose ONLY. Absolutely no markdown symbols like asterisks (**), hashtags (###), bullet points, list items (-), blockquotes (>), or backticks.
2. The response must contain a MAXIMUM of 2 sentences.
3. The insight must be written for a citizen reading a public dashboard (friendly, clear, and highly informative).
4. Do NOT draft any letters or complaints. Do NOT include notes for developers, technical meta-commentary, or status updates.
5. If the data is insufficient, sparse, or does not show any clear, recurring patterns, state plainly in exactly one sentence that there is currently not enough municipal data to identify clear trend patterns. Do not invent speculative analysis to fill space.`;

  let response: any;
  let succeededWithModel = '';
  let attempts = 0;
  const maxAttempts = 3;
  let delayMs = 1000;
  let retriesAttempted = 0;

  try {
    while (attempts < maxAttempts) {
      try {
        attempts++;
        response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: userContent,
          config: {
            systemInstruction,
            temperature: 0.1,
          },
        });
        succeededWithModel = 'gemini-3.5-flash';
        break; // Success, exit retry loop
      } catch (err: any) {
        const isTransient = (
          err.status === 503 || err.status === 429 ||
          err.statusCode === 503 || err.statusCode === 429 ||
          err.code === 503 || err.code === 429 ||
          /503|unavailable|429|rate limit|resource exhausted/i.test(err.message || '')
        );

        if (isTransient) {
          if (attempts < maxAttempts) {
            retriesAttempted++;
            console.warn(`[InsightAgent] Transient error on attempt ${attempts} (${err.message}). Retrying in ${delayMs}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            delayMs += 500;
          } else {
            console.warn(`[InsightAgent] All ${maxAttempts} attempts on gemini-3.5-flash exhausted due to transient errors. Proceeding to gemini-3.1-flash-lite fallback...`);
            break;
          }
        } else {
          // Non-transient error, fail immediately without trying fallback model
          throw err;
        }
      }
    }

    if (!succeededWithModel) {
      try {
        console.log(`[InsightAgent] Attempting one final fallback with gemini-3.1-flash-lite...`);
        response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: userContent,
          config: {
            systemInstruction,
            temperature: 0.1,
          },
        });
        succeededWithModel = 'gemini-3.1-flash-lite';
      } catch (fallbackErr: any) {
        throw new Error(`All attempts failed. gemini-3.5-flash retries exhausted (${retriesAttempted} retries attempted). gemini-3.1-flash-lite fallback failed with: ${fallbackErr.message || 'Unknown error'}`);
      }
    }

    let text = response?.text || '';
    
    // Fallback: Programmatically strip out standard markdown artifacts
    text = text
      .replace(/[#*`_>~]/g, '') // Remove standard formatting characters
      .replace(/^\s*-\s+/gm, '') // Remove leading list hyphens
      .replace(/\s+/g, ' ') // Collapse multiple spaces and lines
      .trim();

    return text || 'There is currently not enough municipal data to identify clear trend patterns.';
  } catch (error: any) {
    console.error('[InsightAgent Error]', error);
    return 'Insights are temporarily unavailable';
  }
}

