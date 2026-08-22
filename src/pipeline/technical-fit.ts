export async function scoreTechnicalFit(
  jd: string,
  cv: string,
  provider: { complete: (system: string, user: string) => Promise<string> },
  flowerFilter?: { keywords: string[]; location?: string; workStyle?: string; peoplePreference?: string; conditions?: string; purpose?: string }
): Promise<{
  score: number;
  reason: string;
  strengths: string[];
  critical_gaps: string[];
  recommendation: string;
  upskill_time: string;
}> {
  let lastError: any;

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const flowerPromptPart = flowerFilter && flowerFilter.keywords.length > 0
        ? `\n\nUser preference keywords to consider: ${flowerFilter.keywords.join(', ')}`
        : '';

      const prompt = `Score the technical fit between this CV and job description.\nCV: ${cv}\n\nJob Description: ${jd}${flowerPromptPart}\n\nReturn JSON with: score (0-100), reason, strengths (array), critical_gaps (array), recommendation, upskill_time.`;
      const response = await provider.complete('', prompt);
      const cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return {
        score: parsed.score ?? 0,
        reason: parsed.reason ?? '',
        strengths: parsed.strengths ?? [],
        critical_gaps: parsed.critical_gaps ?? [],
        recommendation: parsed.recommendation ?? 'skip',
        upskill_time: parsed.upskill_time ?? '',
      };
    } catch (err) {
      lastError = err;
    }
  }

  return {
    score: 0,
    reason: lastError?.message || 'LLM call failed',
    strengths: [],
    critical_gaps: [],
    recommendation: 'skip',
    upskill_time: '',
  };
}