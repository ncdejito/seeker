import 'dotenv/config';
import { runDigest } from '../digest/run.js';

async function main() {
  const started = Date.now();
  const { digest, htmlPath } = await runDigest();
  const secs = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`\nDigest complete in ${secs}s — ${digest.counts.total} jobs`);
  for (const [role, n] of Object.entries(digest.counts.byRole)) {
    console.log(`  ${role}: ${n}`);
  }
  console.log(`Open ${htmlPath} in a browser (or share the GitHub Pages URL).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
