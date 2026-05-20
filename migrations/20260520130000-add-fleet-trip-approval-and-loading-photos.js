'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('fleet_trips', 'approve_status', {
      type: Sequelize.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
      comment: 'Status persetujuan foto muat / trip',
    });

    await queryInterface.addColumn('fleet_trips', 'approve_by_user_id', {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.addColumn('fleet_trips', 'approve_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addIndex('fleet_trips', ['approve_status'], {
      name: 'idx_fleet_trips_approve_status',
    });

    await queryInterface.createTable('fleet_trip_loading_photos', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      fleet_trip_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'fleet_trips', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      file_log_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'file_log', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Referensi file_log (foto muat)',
      },
      sort_order: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        comment: 'Urutan tampilan foto',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('fleet_trip_loading_photos', ['fleet_trip_id'], {
      name: 'idx_fleet_trip_loading_photos_trip_id',
    });

    await queryInterface.addIndex(
      'fleet_trip_loading_photos',
      ['fleet_trip_id', 'file_log_id'],
      {
        name: 'uq_fleet_trip_loading_photos_trip_file',
        unique: true,
      },
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('fleet_trip_loading_photos');
    await queryInterface.removeIndex('fleet_trips', 'idx_fleet_trips_approve_status');
    await queryInterface.removeColumn('fleet_trips', 'approve_at');
    await queryInterface.removeColumn('fleet_trips', 'approve_by_user_id');
    await queryInterface.removeColumn('fleet_trips', 'approve_status');
  },
};
