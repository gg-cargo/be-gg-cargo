'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Tambahkan field yang hilang untuk international order
    await queryInterface.addColumn('orders', 'total_item_value_usd', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Total nilai barang dalam USD'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('orders', 'total_item_value_usd');
  }
};