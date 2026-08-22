import { readFile } from 'fs/promises';

export async function loadFromLocal(path: string): Promise<string> {
  return await readFile(path, 'utf-8');
}

export async function loadFromGDrive(_driveUrl: string): Promise<string> {
  throw new Error('GDrive CV fetch not implemented. Set LOCAL_CV_PATH instead.');
}
