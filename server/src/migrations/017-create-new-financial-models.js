export const up = async (queryInterface, Sequelize) => {
  // This migration's functionality is already covered by earlier migrations in this environment.
  // No-op to avoid duplicate table/constraint creation conflicts.
  console.log('ℹ️ Skipping 017-create-new-financial-models (already applied via previous migrations)');
};

export const down = async (queryInterface, Sequelize) => {
  // No-op
};
