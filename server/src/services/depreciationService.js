// Depreciation service (straight-line) — scaffold implementation
import models, { sequelize } from '../models/index.js';
const { FixedAsset, Account, JournalEntry, JournalEntryDetail, GLEntry } = models;

class DepreciationService {
  /**
   * Calculate monthly depreciation for all active fixed assets and create journal entries.
   * This is a scaffold; adjust account mapping and posting logic as needed.
   */
  static async calculateMonthlyDepreciation({ date = new Date(), createdBy = null } = {}) {
    const t = await sequelize.transaction();
    try {
      const postingDate = new Date(date);

      // Fetch active assets with required fields
      const assets = await FixedAsset.findAll({ where: { status: 'active' } });
      if (!assets || assets.length === 0) {
        await t.commit();
        return { success: true, message: 'No active assets found', createdEntries: 0 };
      }

      let createdCount = 0;

      for (const asset of assets) {
        // Basic straight-line: monthly = (cost - salvage) / usefulLifeMonths
        const cost = Number(asset.purchaseCost || asset.cost || 0);
        const salvage = Number(asset.salvageValue || 0);
        const lifeYears = Number(asset.usefulLife || 0);
        const usefulLifeMonths = lifeYears > 0 ? lifeYears * 12 : 60; // default 5 years
        const monthly = Math.max(0, (cost - salvage) / usefulLifeMonths);
        if (!isFinite(monthly) || monthly <= 0) continue;

        // Determine accounts from DB-linked columns (model may not define them)
        const [accRow] = await sequelize.query(
          'SELECT "depreciationExpenseAccountId" as depExp, "accumulatedDepreciationAccountId" as accDep FROM fixed_assets WHERE id = :id',
          { replacements: { id: asset.id }, type: sequelize.QueryTypes.SELECT }
        );
        const expenseAccountId = accRow?.depExp || null;
        const accumulatedAccountId = accRow?.accDep || null;
        if (!expenseAccountId || !accumulatedAccountId) continue;

        // Create Journal Entry
        const assetKey = asset.assetNumber || (asset.id || '').slice(0,6);
        const ym = postingDate.toISOString().slice(0,7);
        const entryNo = `DEP-${ym}-${assetKey}`;

        // Skip if already posted
        const existing = await GLEntry.count({ where: { voucherType: 'Depreciation', voucherNo: entryNo, isCancelled: false } });
        if (existing > 0) continue;

        const je = await JournalEntry.create({
          entryNumber: entryNo,
          date: postingDate,
          description: `Monthly depreciation for asset ${asset.name || asset.code || asset.id}`,
          totalDebit: monthly,
          totalCredit: monthly,
          status: 'posted',
          type: 'depreciation',
          createdBy: createdBy || 'system'
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
            voucherNo: entryNo,
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
            voucherNo: entryNo,
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
