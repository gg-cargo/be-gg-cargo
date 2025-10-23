'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Hanya tambahkan field yang benar-benar belum ada
    await queryInterface.addColumn('orders', 'customs_notes', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Catatan bea cukai'
    });

    await queryInterface.addColumn('orders', 'commercial_invoice', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'URL commercial invoice'
    });

    await queryInterface.addColumn('orders', 'packing_list', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'URL packing list'
    });

    await queryInterface.addColumn('orders', 'certificate_of_origin', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'URL certificate of origin'
    });

    await queryInterface.addColumn('orders', 'chargeable_weight_total', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Total berat yang dikenakan biaya'
    });

    await queryInterface.addColumn('orders', 'order_type', {
      type: Sequelize.STRING(50),
      allowNull: true,
      comment: 'Tipe order: International, Domestic, dll'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('orders', 'customs_notes');
    await queryInterface.removeColumn('orders', 'commercial_invoice');
    await queryInterface.removeColumn('orders', 'packing_list');
    await queryInterface.removeColumn('orders', 'certificate_of_origin');
    await queryInterface.removeColumn('orders', 'chargeable_weight_total');
    await queryInterface.removeColumn('orders', 'order_type');
  }
};