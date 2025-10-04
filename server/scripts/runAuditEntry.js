import runAudit from './runAudit.js';

(async () => {
  try {
    const report = await runAudit();
    // Ensure non-interactive exit
    process.exit(0);
  } catch (err) {
    console.error('❌ فشل تشغيل التدقيق:', err);
    process.exit(1);
  }
})();