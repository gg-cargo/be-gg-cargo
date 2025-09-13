'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('notification_badges', 'hub_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'ID hub yang terkait dengan notifikasi'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('notification_badges', 'hub_id');
  }
};
