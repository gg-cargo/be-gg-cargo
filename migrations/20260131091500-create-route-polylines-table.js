'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('route_polylines', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      master_route_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      },
      geometry: {
        type: Sequelize.TEXT('long'),
        allowNull: true,
        comment: 'GeoJSON geometry as text',
      },
      distance_m: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      duration_s: {
        type: Sequelize.DOUBLE,
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
    await queryInterface.dropTable('route_polylines');
  },
};

