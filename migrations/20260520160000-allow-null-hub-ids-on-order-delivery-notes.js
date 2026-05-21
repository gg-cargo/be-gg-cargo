'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('order_delivery_notes', 'hub_id', {
      type: Sequelize.INTEGER(11),
      allowNull: true,
    });
    await queryInterface.changeColumn('order_delivery_notes', 'agent_id', {
      type: Sequelize.INTEGER(11),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('order_delivery_notes', 'hub_id', {
      type: Sequelize.INTEGER(11),
      allowNull: false,
    });
    await queryInterface.changeColumn('order_delivery_notes', 'agent_id', {
      type: Sequelize.INTEGER(11),
      allowNull: false,
    });
  },
};
