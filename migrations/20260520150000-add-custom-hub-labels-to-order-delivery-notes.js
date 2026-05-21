'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('order_delivery_notes', 'from_hub_nama', {
      type: Sequelize.STRING(200),
      allowNull: true,
      comment: 'Label From di PDF (override nama hub asal)',
    });
    await queryInterface.addColumn('order_delivery_notes', 'from_hub_alamat', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Alamat From di PDF (override hub asal)',
    });
    await queryInterface.addColumn('order_delivery_notes', 'to_hub_nama', {
      type: Sequelize.STRING(200),
      allowNull: true,
      comment: 'Label To di PDF (override nama hub tujuan)',
    });
    await queryInterface.addColumn('order_delivery_notes', 'to_hub_alamat', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Alamat To di PDF (override hub tujuan)',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('order_delivery_notes', 'to_hub_alamat');
    await queryInterface.removeColumn('order_delivery_notes', 'to_hub_nama');
    await queryInterface.removeColumn('order_delivery_notes', 'from_hub_alamat');
    await queryInterface.removeColumn('order_delivery_notes', 'from_hub_nama');
  },
};
