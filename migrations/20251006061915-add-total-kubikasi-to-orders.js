'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add column total_kubikasi to orders table
     */
    await queryInterface.addColumn('orders', 'total_kubikasi', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Total kubikasi dalam meter kubik'
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Remove column total_kubikasi from orders table
     */
    await queryInterface.removeColumn('orders', 'total_kubikasi');
  }
};
