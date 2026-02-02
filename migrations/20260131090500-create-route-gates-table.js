'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('route_gates', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      master_route_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
      },
      external_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      type: {
        type: Sequelize.ENUM('tol', 'pelabuhan'),
        allowNull: false,
        defaultValue: 'tol',
      },
      lat: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      lng: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      toll_fee: {
        type: Sequelize.BIGINT,
        allowNull: true,
        defaultValue: 0,
      },
      sequence_index: {
        type: Sequelize.INTEGER,
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
    await queryInterface.addIndex('route_gates', ['lat', 'lng']);
  },

  async down(queryInterface /* , Sequelize */) {
    await queryInterface.dropTable('route_gates');
  },
};

