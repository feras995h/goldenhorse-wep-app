import { spawn } from 'child_process';

const migrate = spawn('node', ['scripts/migrate.js'], {
  cwd: process.cwd(),
  stdio: 'pipe'
});

let stdout = '';
let stderr = '';

migrate.stdout.on('data', (data) => {
  const text = data.toString();
  stdout += text;
  process.stdout.write(text);
});

migrate.stderr.on('data', (data) => {
  const text = data.toString();
  stderr += text;
  process.stderr.write(text);
});

migrate.on('close', (code) => {
  console.log(`\n\n=== Migration completed with exit code: ${code} ===`);
  if (code !== 0) {
    console.log('\n=== STDERR ===');
    console.log(stderr);
  }
  process.exit(code);
});
