'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('order_invoice_details', 'additional_fee', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Menandai baris tagihan sebagai biaya tambahan',
      after: 'remark',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('order_invoice_details', 'additional_fee');
  },
};
