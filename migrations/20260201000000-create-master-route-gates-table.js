'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('master_route_gates', {
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
      route_gate_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      },
      sequence_index: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      toll_fee_override: {
        type: Sequelize.BIGINT,
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
    await queryInterface.addIndex('master_route_gates', ['master_route_id']);
    await queryInterface.addIndex('master_route_gates', ['route_gate_id']);
  },

  async down(queryInterface /* , Sequelize */) {
    await queryInterface.dropTable('master_route_gates');
  },
};

