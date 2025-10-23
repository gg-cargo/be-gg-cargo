'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('order_pieces', 'chargeable_weight', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Berat yang dikenakan biaya (maksimum dari berat aktual dan berat volume)'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('order_pieces', 'chargeable_weight');
  }
};