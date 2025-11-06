'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('orders', 'vendor_id', {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: true,
      after: 'transporter_id'
    });
    await queryInterface.addIndex('orders', ['vendor_id'], {
      name: 'idx_orders_vendor_id'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeIndex('orders', 'idx_orders_vendor_id');
    await queryInterface.removeColumn('orders', 'vendor_id');
  }
};
