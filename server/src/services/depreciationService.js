// Depreciation service (straight-line) — scaffold implementation
import models, { sequelize } from '../models/index.js';
const { FixedAsset, Account, JournalEntry, JournalEntryDetail, GLEntry } = models;

class DepreciationService {
  /**
   * Calculate monthly depreciation for all active fixed assets and create journal entries.
   * This is a scaffold; adjust account mapping and posting logic as needed.
   */
  static async calculateMonthlyDepreciation({ date = new Date(), createdBy = 'system' } = {}) {
    const t = await sequelize.transaction();
    try {
      const postingDate = new Date(date);

      // Fetch active assets with required fields
      const assets = await FixedAsset.findAll({ where: { isActive: true } });
      if (!assets || assets.length === 0) {
        await t.commit();
        return { success: true, message: 'No active assets found', createdEntries: 0 };
      }

      let createdCount = 0;

      for (const asset of assets) {
        // Basic straight-line: monthly = (cost - salvage) / usefulLifeMonths
        const cost = Number(asset.purchaseCost || asset.cost || 0);
        const salvage = Number(asset.salvageValue || 0);
        const usefulLifeMonths = Number(asset.usefulLifeMonths || 0) || 60; // default 5 years
        const monthly = Math.max(0, (cost - salvage) / usefulLifeMonths);
        if (!isFinite(monthly) || monthly <= 0) continue;

        // Determine accounts — customize to your chart
        // Expect these IDs to be configured on asset or via mapping
        const expenseAccountId = asset.expenseAccountId || null;
        const accumulatedAccountId = asset.accumulatedDepAccountId || null;
        if (!expenseAccountId || !accumulatedAccountId) continue;

        // Create Journal Entry
        const je = await JournalEntry.create({
          entryNumber: `DEP-${postingDate.toISOString().slice(0,10)}-${asset.id.slice(0,6)}`,
          date: postingDate,
          description: `Monthly depreciation for asset ${asset.name || asset.code || asset.id}`,
          totalDebit: monthly,
          totalCredit: monthly,
          status: 'posted',
          type: 'depreciation',
          createdBy
        }, { transaction: t });

        // Details: Dr Expense, Cr Accumulated Depreciation
        const dr = await JournalEntryDetail.create({
          journalEntryId: je.id,
          accountId: expenseAccountId,
          description: 'Depreciation expense',
          debit: monthly,
          credit: 0
        }, { transaction: t });

        const cr = await JournalEntryDetail.create({
          journalEntryId: je.id,
          accountId: accumulatedAccountId,
          description: 'Accumulated depreciation',
          debit: 0,
          credit: monthly
        }, { transaction: t });

        // Post to GL (bypass includes to reduce coupling)
        await GLEntry.bulkCreate([
          {
            postingDate: postingDate,
            accountId: expenseAccountId,
            debit: monthly,
            credit: 0,
            voucherType: 'Depreciation',
            voucherNo: je.entryNumber,
            journalEntryId: je.id,
            remarks: 'Depreciation expense',
            currency: 'LYD',
            exchangeRate: 1,
            createdBy
          },
          {
            postingDate: postingDate,
            accountId: accumulatedAccountId,
            debit: 0,
            credit: monthly,
            voucherType: 'Depreciation',
            voucherNo: je.entryNumber,
            journalEntryId: je.id,
            remarks: 'Accumulated depreciation',
            currency: 'LYD',
            exchangeRate: 1,
            createdBy
          }
        ], { transaction: t });

        createdCount += 1;
      }

      await t.commit();
      return { success: true, createdEntries: createdCount };
    } catch (error) {
      await t.rollback();
      return { success: false, error: error.message };
    }
  }
}

export default DepreciationService;
