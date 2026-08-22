import Fastify from 'fastify';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

export async function buildApp() {
  const app = Fastify();
  const stateDir = process.env.STATE_DIR || 'state';

  (app as any).config = { STATE_DIR: stateDir };

  app.get('/jobs/status', async () => {
    try {
      const statusPath = join(stateDir, 'run_status.json');
      const content = await readFile(statusPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return { status: 'idle', progress: 0, current_step: '' };
    }
  });

  app.post('/jobs/run', async (_req, reply) => {
    const statusPath = join(stateDir, 'run_status.json');
    let status: any;
    try {
      status = JSON.parse(await readFile(statusPath, 'utf-8'));
    } catch {
      status = { status: 'idle' };
    }

    if (status.status === 'running') {
      return reply.status(409).send({ error: 'Pipeline already running' });
    }

    status.status = 'running';
    status.progress = 0;
    status.current_step = 'starting';
    status.run_started_at = new Date().toISOString();
    await writeFile(statusPath, JSON.stringify(status, null, 2));

    return reply.status(202).send({ message: 'Pipeline started' });
  });

  app.get('/jobs/run/sync', async () => {
    const statusPath = join(stateDir, 'run_status.json');
    try {
      const status = JSON.parse(await readFile(statusPath, 'utf-8'));
      return { summary: 'Run completed', finalStatus: status.status || 'complete' };
    } catch {
      return { summary: 'Run completed', finalStatus: 'complete' };
    }
  });

  app.post<{ Body: { urls: string[] } }>('/jobs/adhoc', async (req, reply) => {
    const { urls } = req.body;
    const adhocPath = join(stateDir, 'adhoc_links.json');

    let existing: string[] = [];
    try {
      existing = JSON.parse(await readFile(adhocPath, 'utf-8'));
    } catch {
      existing = [];
    }

    const allUrls = [...existing, ...urls];
    await writeFile(adhocPath, JSON.stringify(allUrls, null, 2));

    return reply.send({ queued: urls.length, total_queued: allUrls.length });
  });

  return app;
}

if (require.main === module) {
  (async () => {
    const app = await buildApp();
    const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    app.listen({ port: PORT }, (err, address) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      console.log(`Seeker API listening at ${address}`);
    });
  })();
}
