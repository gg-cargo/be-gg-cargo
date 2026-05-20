'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const table = await queryInterface.describeTable('fleet_trip_assignments');
    if (!table.vendor_id) {
      return;
    }

    try {
      await queryInterface.removeConstraint(
        'fleet_trip_assignments',
        'fleet_trip_assignments_vendor_id_foreign_idx',
      );
    } catch {
      try {
        await queryInterface.removeConstraint(
          'fleet_trip_assignments',
          'fleet_trip_assignments_ibfk_4',
        );
      } catch {
        // Constraint name may differ per environment; continue if already absent.
      }
    }

    await queryInterface.changeColumn('fleet_trip_assignments', 'vendor_id', {
      type: 'BIGINT UNSIGNED',
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.removeConstraint(
        'fleet_trip_assignments',
        'fleet_trip_assignments_vendor_id_foreign_idx',
      );
    } catch {
      // ignore
    }

    await queryInterface.changeColumn('fleet_trip_assignments', 'vendor_id', {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: true,
      references: { model: 'vendors', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },
};
