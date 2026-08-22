export async function matchResumes(
  jd: string,
  resumes: Array<{ role: string; careerSummary: string }>,
  provider: { complete: (system: string, user: string) => Promise<string> },
  flowerFilter?: { keywords: string[]; location?: string; workStyle?: string; peoplePreference?: string; conditions?: string; purpose?: string }
): Promise<Array<{ role: string; score: number; reason: string }>> {
  try {
    const truncatedJD = jd.split(' ').slice(0, 800).join(' ');
    const cappedSummaries = resumes.map(r => ({
      ...r,
      careerSummary: r.careerSummary.split(' ').slice(0, 250).join(' '),
    }));

    const summariesText = cappedSummaries
      .map(r => `Role: ${r.role}\nSummary: ${r.careerSummary}`)
      .join('\n\n');

    const flowerPromptPart = flowerFilter
      ? `\n\nUser preference keywords: ${flowerFilter.keywords.join(', ')}`
      : '';

    const prompt = `Match this job description against these resume roles${flowerPromptPart}.\nJD: ${truncatedJD}\n\nResumes:\n${summariesText}\n\nReturn JSON array of top matches with role, score (0-100), and reason.`;
    const response = await provider.complete('', prompt);
    const cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return (parsed.matches || parsed).slice(0, 3);
  } catch {
    return [];
  }
}