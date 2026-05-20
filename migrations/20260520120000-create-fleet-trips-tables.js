'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('fleet_trips', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      tracking_no: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: 'Nomor tracking trip, contoh GG2025010001',
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
      kota_asal: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      kota_tujuan: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      vehicle_type: {
        type: Sequelize.STRING(30),
        allowNull: false,
      },
      distance_km_total: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      estimasi_bbm_total: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      estimasi_tol_total: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      estimasi_waktu_tiba: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Format tampilan, mis. 2 jam 3 menit',
      },
      estimasi_waktu_menit: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
      },
      supir_1_total: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      supir_2_total: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      },
      supir_2_eligible: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      grand_total_operational: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      fuel_type: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('draft', 'active', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'draft',
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

    await queryInterface.createTable('fleet_trip_waypoints', {
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
      sequence: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      },
      label: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      lat: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      lng: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    });

    await queryInterface.createTable('fleet_trip_segments', {
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
      segment_no: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      },
      titik_asal: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      titik_tujuan: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      titik_asal_lat: { type: Sequelize.DOUBLE, allowNull: false },
      titik_asal_lng: { type: Sequelize.DOUBLE, allowNull: false },
      titik_tujuan_lat: { type: Sequelize.DOUBLE, allowNull: false },
      titik_tujuan_lng: { type: Sequelize.DOUBLE, allowNull: false },
      road_type: {
        type: Sequelize.ENUM('tol', 'non_tol'),
        allowNull: false,
      },
      distance_km: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      route_variant: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      route_jarak_km: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      route_estimasi_waktu: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      route_biaya_tol_idr: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      },
      estimate_bbm_total: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      estimate_fuel_type: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      estimate_toll_total: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      },
      estimate_distance_km_effective: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      estimate_grand_total_operational: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
    });

    await queryInterface.createTable('fleet_trip_assignments', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      fleet_trip_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        unique: true,
        references: { model: 'fleet_trips', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      assignee_type: {
        type: Sequelize.ENUM('mitra', 'vendor'),
        allowNull: false,
      },
      assigned_by_user_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
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
      vendor_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: 'vendors', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
    });

    await queryInterface.addIndex('fleet_trips', ['status'], {
      name: 'idx_fleet_trips_status',
    });
    await queryInterface.addIndex('fleet_trip_waypoints', ['fleet_trip_id', 'sequence'], {
      name: 'idx_fleet_trip_waypoints_trip_seq',
    });
    await queryInterface.addIndex('fleet_trip_segments', ['fleet_trip_id', 'segment_no'], {
      name: 'idx_fleet_trip_segments_trip_seg',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('fleet_trip_assignments');
    await queryInterface.dropTable('fleet_trip_segments');
    await queryInterface.dropTable('fleet_trip_waypoints');
    await queryInterface.dropTable('fleet_trips');
  },
};
