export async function scoreAspirationalFit(
  jd: string,
  provider: { complete: (system: string, user: string) => Promise<string> },
  flowerFilter?: { keywords: string[]; location?: string; workStyle?: string; peoplePreference?: string; conditions?: string; purpose?: string }
): Promise<{
  dimensions: Record<string, number>;
  overall: number;
}> {
  try {
    const flowerPromptPart = flowerFilter
      ? `\n\nUser preferences: ${JSON.stringify(flowerFilter)}`
      : '';

    const prompt = `Score the aspirational fit of this job description${flowerPromptPart}.\nJD: ${jd}\n\nReturn JSON with dimensions object and overall score.`;
    const response = await provider.complete('', prompt);
    const cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(cleaned);
    const dimensions = parsed.dimensions || {};
    if (!('salary' in dimensions)) {
      dimensions.salary = 2;
    }
    return {
      dimensions,
      overall: parsed.overall ?? 0,
    };
  } catch {
    return {
      dimensions: { salary: 2, growth: 3, stability: 3, mission: 3, learning: 3 },
      overall: 3,
    };
  }
}