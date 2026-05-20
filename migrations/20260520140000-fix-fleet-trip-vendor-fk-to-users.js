'use strict';

/** Re-run fix jika migration sebelumnya gagal menghapus ibfk_5. */
async function repointVendorIdToUsers(queryInterface) {
  const sequelize = queryInterface.sequelize;

  const [constraints] = await sequelize.query(`
    SELECT CONSTRAINT_NAME, REFERENCED_TABLE_NAME
    FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'fleet_trip_assignments'
      AND COLUMN_NAME = 'vendor_id'
      AND REFERENCED_TABLE_NAME IS NOT NULL
  `);

  const refsVendors = constraints.filter(
    (r) => String(r.REFERENCED_TABLE_NAME).toLowerCase() === 'vendors',
  );

  if (refsVendors.length === 0) {
    return;
  }

  for (const row of refsVendors) {
    await sequelize.query(
      `ALTER TABLE \`fleet_trip_assignments\` DROP FOREIGN KEY \`${row.CONSTRAINT_NAME}\``,
    );
  }

  const [afterDrop] = await sequelize.query(`
    SELECT CONSTRAINT_NAME
    FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'fleet_trip_assignments'
      AND COLUMN_NAME = 'vendor_id'
      AND REFERENCED_TABLE_NAME IS NOT NULL
  `);

  if (afterDrop.length === 0) {
    await sequelize.query(`
      ALTER TABLE \`fleet_trip_assignments\`
      ADD CONSTRAINT \`fleet_trip_assignments_vendor_id_users_fk\`
      FOREIGN KEY (\`vendor_id\`) REFERENCES \`users\` (\`id\`)
      ON DELETE SET NULL ON UPDATE CASCADE
    `);
  }
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await repointVendorIdToUsers(queryInterface);
  },

  async down() {
    // No-op: rollback handled by 20260519140000 down if needed.
  },
};
