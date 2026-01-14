'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('order_invoices', 'billed_currency', {
      type: Sequelize.STRING(3),
      allowNull: true,
      defaultValue: 'IDR',
      after: 'payment_terms',
    });

    await queryInterface.addColumn('order_invoices', 'billed_amount', {
      type: Sequelize.DECIMAL(18, 2),
      allowNull: true,
      after: 'billed_currency',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('order_invoices', 'billed_amount');
    await queryInterface.removeColumn('order_invoices', 'billed_currency');
  },
};

