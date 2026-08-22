export async function filterByTitle(
  title: string,
  roleKeywords: string,
  provider: { complete: (system: string, user: string) => Promise<string> },
  flowerFilter?: { keywords: string[]; location?: string; workStyle?: string; peoplePreference?: string; conditions?: string; purpose?: string }
): Promise<{ skip: boolean; skipReason?: string }> {
  const basePrompt = `Rate how well the job title "${title}" matches keywords "${roleKeywords}". Return JSON with a "score" field from 0-100. Score >= 40 means it is a match.`;

  let prompt: string;

  if (flowerFilter && flowerFilter.keywords.length > 0) {
    const extraKeywords = flowerFilter.keywords.join(', ');
    prompt = `Rate how well the job title "${title}" matches these additional keywords from user preferences: ${extraKeywords}. Return JSON with a "score" field from 0-100. Score >= 40 means it is a match.`;
  } else {
    prompt = basePrompt;
  }

  try {
    const response = await provider.complete('', prompt);
    const cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(cleaned);
    const score = parsed.score;

    if (score >= 40) {
      return { skip: false };
    }
    return { skip: true, skipReason: `low title fit (score: ${score})` };
  } catch {
    return { skip: true, skipReason: 'failed to parse LLM response' };
  }
}