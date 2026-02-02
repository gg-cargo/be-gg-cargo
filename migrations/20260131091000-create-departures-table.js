'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('departures', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      truck_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
      },
      driver_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      },
      scheduled_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      assigned_route_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
      },
      est_fuel: {
        type: Sequelize.BIGINT,
        allowNull: true,
        defaultValue: 0,
      },
      est_driver1: {
        type: Sequelize.BIGINT,
        allowNull: true,
        defaultValue: 0,
      },
      est_driver2: {
        type: Sequelize.BIGINT,
        allowNull: true,
        defaultValue: 0,
      },
      other_costs: {
        type: Sequelize.BIGINT,
        allowNull: true,
        defaultValue: 0,
      },
      toll_total: {
        type: Sequelize.BIGINT,
        allowNull: true,
        defaultValue: 0,
      },
      grand_total: {
        type: Sequelize.BIGINT,
        allowNull: true,
        defaultValue: 0,
      },
      status: {
        type: Sequelize.ENUM('pending', 'scheduled', 'departed', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
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
    await queryInterface.dropTable('departures');
  },
};

