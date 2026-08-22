export interface FlowerPart {
  id: number;
  label: string;
  description: string;
}

export interface FlowerAnswers {
  part1: string;
  part2: string;
  part3: string;
  part4: string;
  part5: string;
  part6: string;
  part7: string;
}

export interface FlowerFilterCriteria {
  keywords: string[];
  location?: string;
  workStyle?: string;
  peoplePreference?: string;
  conditions?: string;
  purpose?: string;
}

export const FLOWER_PARTS: FlowerPart[] = [
  { id: 1, label: 'Who you are', description: 'identity' },
  { id: 2, label: 'What you want to do', description: 'goals' },
  { id: 3, label: 'Where you want to do it', description: 'location' },
  { id: 4, label: 'How you want to do it', description: 'working style' },
  { id: 5, label: 'Who you want to do it with', description: 'team culture' },
  { id: 6, label: 'Conditions you\'ll accept', description: 'salary benefits' },
  { id: 7, label: 'Why you want to do it', description: 'purpose motivation' }
];

export const FLOWER_KEYWORDS_MAP: Record<number, string> = {
  1: 'skills values identity',
  2: 'goals ambitions work type',
  3: 'location geography area',
  4: 'working style preferences',
  5: 'team culture people colleagues',
  6: 'salary benefits conditions',
  7: 'purpose motivation driver'
};
