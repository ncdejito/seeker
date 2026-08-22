import { readdir } from 'fs/promises';
import { join } from 'path';

export interface ResumeMetadata {
  role: string;
  careerSummary: string;
  filePath: string;
}

export async function loadResumes(resumesDir: string): Promise<ResumeMetadata[]> {
  const files = await readdir(resumesDir);
  const tsFiles = files.filter(f => f.endsWith('.ts'));

  const resumes: ResumeMetadata[] = [];
  for (const file of tsFiles) {
    try {
      const mod = await import(join(resumesDir, file));
      const data = mod.default || mod;
      if (data.role) {
        resumes.push({
          role: data.role,
          careerSummary: data.careerSummary || '',
          filePath: data.filePath || join(resumesDir, file),
        });
      }
    } catch {
      continue;
    }
  }

  return resumes;
}
