/* eslint-disable @typescript-eslint/no-var-requires */
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('order_kendala', 'updated_at', {
      type: 'TIMESTAMP',
      allowNull: true,
      defaultValue: null,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('order_kendala', 'updated_at', {
      type: Sequelize.STRING(200),
      allowNull: true,
      defaultValue: null,
    });
  },
};
