// Wrapper to run server/clean-database.js with embedded DATABASE_URL
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readEmbeddedDatabaseUrl() {
  const setupPath = path.join(__dirname, 'setup-database.js');
  const content = fs.readFileSync(setupPath, 'utf8');
  const m = content.match(/postgres:\/\/[^'"\s]+/);
  if (!m) throw new Error('DATABASE_URL not found in setup-database.js');
  return m[0];
}

(async () => {
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = readEmbeddedDatabaseUrl();
  }
  const target = pathToFileURL(path.join(__dirname, 'server', 'clean-database.js')).href;
  await import(target);
})();
