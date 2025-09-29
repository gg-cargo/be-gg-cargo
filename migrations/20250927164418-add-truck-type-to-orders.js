'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('orders', 'truck_type', {
      type: Sequelize.STRING(200),
      allowNull: true,
      comment: 'Jenis truk untuk sewa truk (CDD box, CDDL box, Pick Up box, Fuso box, CDE box)'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('orders', 'truck_type');
  }
};
