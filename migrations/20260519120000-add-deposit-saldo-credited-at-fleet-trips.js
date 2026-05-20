'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('fleet_trips', 'deposit_saldo_credited_at', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Waktu deposit supir dikredit ke tabel saldo (sekali per trip)',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('fleet_trips', 'deposit_saldo_credited_at');
  },
};
