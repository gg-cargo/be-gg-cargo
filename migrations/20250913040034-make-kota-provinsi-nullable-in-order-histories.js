'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Mengubah kolom provinsi menjadi nullable
    await queryInterface.changeColumn('order_histories', 'provinsi', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    // Mengubah kolom kota menjadi nullable
    await queryInterface.changeColumn('order_histories', 'kota', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert kolom provinsi menjadi not null
    await queryInterface.changeColumn('order_histories', 'provinsi', {
      type: Sequelize.STRING(255),
      allowNull: false,
    });

    // Revert kolom kota menjadi not null
    await queryInterface.changeColumn('order_histories', 'kota', {
      type: Sequelize.STRING(255),
      allowNull: false,
    });
  }
};
