import { readFile } from 'fs/promises';
import { join } from 'path';

export async function loadPrompt(filename: string): Promise<string> {
  const promptsDir = process.env.PROMPTS_DIR || join(process.cwd(), 'prompts');
  const filePath = join(promptsDir, filename);
  return await readFile(filePath, 'utf-8');
}

export function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    if (vars[varName] === undefined) {
      throw new Error(`Unknown variable {{${varName}}}`);
    }
    return vars[varName];
  });
}
