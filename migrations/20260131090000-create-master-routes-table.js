'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('master_routes', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      route_code: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      origin_name: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      origin_lat: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      origin_lng: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      destination_name: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      destination_lat: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      destination_lng: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      route_type: {
        type: Sequelize.ENUM('one_way', 'round_trip', 'multi_drop'),
        allowNull: false,
        defaultValue: 'one_way',
      },
      road_constraint: {
        type: Sequelize.ENUM('tol', 'non_tol', 'campuran'),
        allowNull: false,
        defaultValue: 'tol',
      },
      service_zone: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      default_distance_km: {
        type: Sequelize.DOUBLE,
        allowNull: false,
        defaultValue: 0,
      },
      default_duration_min: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      created_by: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
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
  },

  async down(queryInterface /* , Sequelize */) {
    await queryInterface.dropTable('master_routes');
  },
};

