'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('order_invoice_details', 'unit_price_sgd', {
      type: Sequelize.DECIMAL(18, 2),
      allowNull: true,
      after: 'unit_price',
    });

    await queryInterface.addColumn('order_invoice_details', 'total_price_sgd', {
      type: Sequelize.DECIMAL(18, 2),
      allowNull: true,
      after: 'unit_price_sgd',
    });

    await queryInterface.addColumn('order_invoice_details', 'exchange_rate_idr', {
      type: Sequelize.DECIMAL(18, 2),
      allowNull: true,
      comment: 'Kurs IDR untuk 1 SGD pada saat billing item dibuat',
      after: 'total_price_sgd',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('order_invoice_details', 'exchange_rate_idr');
    await queryInterface.removeColumn('order_invoice_details', 'total_price_sgd');
    await queryInterface.removeColumn('order_invoice_details', 'unit_price_sgd');
  },
};

