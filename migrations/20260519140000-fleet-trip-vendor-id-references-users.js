'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await repointVendorIdToUsers(queryInterface);
  },

  async down(queryInterface, Sequelize) {
    const sequelize = queryInterface.sequelize;

    const [constraints] = await sequelize.query(`
      SELECT CONSTRAINT_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'fleet_trip_assignments'
        AND COLUMN_NAME = 'vendor_id'
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `);

    for (const row of constraints) {
      await sequelize.query(
        `ALTER TABLE \`fleet_trip_assignments\` DROP FOREIGN KEY \`${row.CONSTRAINT_NAME}\``,
      );
    }

    await sequelize.query(`
      ALTER TABLE \`fleet_trip_assignments\`
      ADD CONSTRAINT \`fleet_trip_assignments_vendor_id_vendors_fk\`
      FOREIGN KEY (\`vendor_id\`) REFERENCES \`vendors\` (\`id\`)
      ON DELETE SET NULL ON UPDATE CASCADE
    `);
  },
};

/**
 * Ubah FK fleet_trip_assignments.vendor_id dari vendors → users.
 */
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

  const alreadyUsers = constraints.some(
    (r) => String(r.REFERENCED_TABLE_NAME).toLowerCase() === 'users',
  );
  if (alreadyUsers && constraints.length === 1) {
    return;
  }

  for (const row of constraints) {
    await sequelize.query(
      `ALTER TABLE \`fleet_trip_assignments\` DROP FOREIGN KEY \`${row.CONSTRAINT_NAME}\``,
    );
  }

  const [remaining] = await sequelize.query(`
    SELECT CONSTRAINT_NAME
    FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'fleet_trip_assignments'
      AND COLUMN_NAME = 'vendor_id'
      AND REFERENCED_TABLE_NAME IS NOT NULL
  `);

  if (remaining.length === 0) {
    await sequelize.query(`
      ALTER TABLE \`fleet_trip_assignments\`
      ADD CONSTRAINT \`fleet_trip_assignments_vendor_id_users_fk\`
      FOREIGN KEY (\`vendor_id\`) REFERENCES \`users\` (\`id\`)
      ON DELETE SET NULL ON UPDATE CASCADE
    `);
  }
}
