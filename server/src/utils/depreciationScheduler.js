import cron from 'node-cron';
import models, { sequelize } from '../models/index.js';
import monitoringManager from './monitoringManager.js';

/**
 * Fixed Assets Depreciation Scheduler
 * - Posts due depreciation schedule entries automatically
 * - Uses Postgres function create_depreciation_entry(schedule_id, user_id)
 * - Safe to run daily; it will only post pending entries up to current date
 */
class DepreciationScheduler {
  constructor() {
    this.enabled = process.env.ENABLE_DEPRECIATION_SCHEDULER !== '0';
    this.cronExpr = process.env.DEPRECIATION_CRON || '15 2 * * *'; // Daily at 02:15
    this.initialized = false;

    if (this.enabled) {
      this.scheduleJobs();
      this.initialized = true;
      console.log(`⏰ Depreciation scheduler initialized (cron: ${this.cronExpr})`);
      this.logInfo('Depreciation scheduler initialized', { cron: this.cronExpr });
    } else {
      console.log('⏸️ Depreciation scheduler disabled (ENABLE_DEPRECIATION_SCHEDULER=0)');
      this.logInfo('Depreciation scheduler disabled');
    }
  }

  scheduleJobs() {
    try {
      cron.schedule(this.cronExpr, async () => {
        try {
          await this.logInfo('Starting scheduled depreciation run');
          const result = await this.runDueDepreciation('system');
          await this.logInfo('Completed scheduled depreciation run', result);
        } catch (err) {
          await this.logError(err, null, { component: 'DepreciationScheduler', phase: 'scheduled_run' });
        }
      });
    } catch (err) {
      console.error('❌ Failed to schedule depreciation job:', err.message);
      this.logError(err, null, { component: 'DepreciationScheduler', phase: 'scheduleJobs' });
    }
  }

  /**
   * Run depreciation for all pending schedule entries up to current date (inclusive)
   * @param {string} userId - User ID used for createdBy; default 'system'
   * @param {Date|string} asOfDate - Optional as-of date; defaults to CURRENT_DATE in DB
   */
  async runDueDepreciation(userId = 'system', asOfDate = null) {
    const t = await sequelize.transaction();
    try {
      const dateFilter = asOfDate ? new Date(asOfDate) : null;

      // Find pending schedule entries due to be posted
      const [pending] = await sequelize.query(`
        SELECT id
        FROM depreciation_schedules
        WHERE status = 'pending'
          AND "scheduleDate" <= COALESCE(:asOfDate::date, CURRENT_DATE)
        ORDER BY "scheduleDate" ASC
      `, {
        replacements: { asOfDate: dateFilter ? dateFilter.toISOString().slice(0,10) : null },
        type: sequelize.QueryTypes.SELECT,
        transaction: t
      });

      const pendingList = Array.isArray(pending) ? pending : (pending ? [pending] : []);
      if (pendingList.length === 0) {
        await t.commit();
        return { success: true, posted: 0, message: 'No pending depreciation entries due' };
      }

      let posted = 0;
      const createdJournalEntries = [];

      for (const row of pendingList) {
        const scheduleId = row.id || row?.schedule_id;
        if (!scheduleId) continue;
        const [res] = await sequelize.query(
          'SELECT create_depreciation_entry(:scheduleId, :userId) AS journal_entry_id',
          {
            replacements: { scheduleId, userId },
            type: sequelize.QueryTypes.SELECT,
            transaction: t
          }
        );
        if (res?.journal_entry_id) {
          createdJournalEntries.push(res.journal_entry_id);
        }
        posted += 1;
      }

      await t.commit();
      return { success: true, posted, journalEntries: createdJournalEntries };
    } catch (error) {
      await t.rollback();
      return { success: false, error: error.message };
    }
  }

  async logInfo(message, meta = {}) {
    try {
      if (monitoringManager?.log) {
        await monitoringManager.log('info', message, { component: 'DepreciationScheduler', ...meta });
      }
    } catch (_) {}
  }

  async logError(error, context = null, meta = {}) {
    try {
      if (monitoringManager?.logError) {
        await monitoringManager.logError(error, context, { component: 'DepreciationScheduler', ...meta });
      }
    } catch (_) {}
  }
}

const depreciationScheduler = new DepreciationScheduler();
export default depreciationScheduler;