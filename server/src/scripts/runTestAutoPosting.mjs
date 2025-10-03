// Runner to force NODE_ENV=test and load server/.env.test before importing the test script
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

process.env.NODE_ENV = 'test';
// Load env from server/.env.test
dotenv.config({ path: path.resolve(process.cwd(), 'server', '.env.test') });

import('./testAutoPosting.mjs');
