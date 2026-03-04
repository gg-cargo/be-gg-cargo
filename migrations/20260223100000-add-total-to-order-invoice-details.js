'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('order_invoice_details', 'total', {
      type: Sequelize.DECIMAL(18, 2),
      allowNull: true,
      comment: 'Total per baris (qty * unit_price) atau dari billing item',
      after: 'unit_price',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('order_invoice_details', 'total');
  },
};
