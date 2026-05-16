'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('fleet_estimates', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      kota_asal: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      kota_tujuan: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      trip_type: {
        type: Sequelize.ENUM('one_way', 'two_way'),
        allowNull: false,
        defaultValue: 'one_way',
      },
      road_type: {
        type: Sequelize.ENUM('non_tol', 'tol', 'manual'),
        allowNull: false,
        defaultValue: 'manual',
      },
      distance_km: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Jarak satu arah (km), input user / GMaps',
      },
      distance_km_effective: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Jarak efektif setelah trip_type (two_way = distance_km x 2)',
      },
      vehicle_type: {
        type: Sequelize.STRING(30),
        allowNull: false,
        comment: 'CDDL, TRAGA, CARRY',
      },
      driver_1_user_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      driver_2_user_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      driver_1_wage: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        comment: 'Upah supir 1 (IDR)',
      },
      driver_2_wage: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        defaultValue: null,
        comment: 'Upah supir 2 (IDR), null jika tidak ada supir 2',
      },
      fuel_estimate: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        comment: 'Estimasi BBM (IDR)',
      },
      grand_total_operational: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        comment: 'Total operasional (supir 1 + supir 2 + BBM)',
      },
      driver_1_account_no: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Nomor rekening supir 1 (snapshot)',
      },
      driver_2_account_no: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Nomor rekening supir 2 (snapshot)',
      },
      loading_photo_file_log_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'file_log', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Bukti foto muat / loading',
      },
      approval_status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending',
        comment: 'pending = belum approve',
      },
      approved_by_user_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      approved_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      departure_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'departures', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Opsional: diisi setelah disetujui dan dibuat departure',
      },
      created_by_user_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    await queryInterface.addIndex('fleet_estimates', ['approval_status'], {
      name: 'idx_fleet_estimates_approval_status',
    });
    await queryInterface.addIndex('fleet_estimates', ['created_by_user_id'], {
      name: 'idx_fleet_estimates_created_by',
    });
    await queryInterface.addIndex('fleet_estimates', ['created_at'], {
      name: 'idx_fleet_estimates_created_at',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('fleet_estimates');
  },
};
