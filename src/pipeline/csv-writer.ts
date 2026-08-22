import * as csvWriter from 'csv-writer';
import { join } from 'path';

export interface JobRecord {
  job_title: string;
  company: string;
  total_fit?: number;
  skip_reason?: string;
  recommendation?: string;
  date?: string;
  job_url?: string;
  job_title_from_site?: string;
  company_from_site?: string;
  location?: string;
  source?: string;
}

export async function writeCSV(rows: any[], outputDir?: string): Promise<string> {
  const today = new Date().toISOString().split('T')[0];
  const dir = outputDir || process.cwd();
  const outputFile = join(dir, `jobs_${today}.csv`);
  
  const csv = csvWriter.createObjectCsvWriter({
    path: outputFile,
    header: [
      { id: 'job_title', title: 'job_title' },
      { id: 'company', title: 'company' },
      { id: 'date', title: 'date' },
      { id: 'job_url', title: 'job_url' },
      { id: 'job_title_from_site', title: 'job_title_from_site' },
      { id: 'company_from_site', title: 'company_from_site' },
      { id: 'location', title: 'location' },
      { id: 'total_fit', title: 'total_fit' },
      { id: 'source', title: 'source' },
      { id: 'skip_reason', title: 'skip_reason' },
      { id: 'recommendation', title: 'recommendation' },
    ],
  });

  // Sort by total_fit descending if present
  const sortedRows = [...rows].sort((a, b) => {
    const fitA = a.total_fit !== undefined ? a.total_fit : 0;
    const fitB = b.total_fit !== undefined ? b.total_fit : 0;
    return fitB - fitA;
  });

  await csv.writeRecords(sortedRows);
  return outputFile;
}
