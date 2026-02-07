'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // remove index if exists, then remove column
    try {
      await queryInterface.removeIndex('sub_services', ['sub_service_code']);
    } catch (e) {
      // ignore if index does not exist
    }
    await queryInterface.removeColumn('sub_services', 'sub_service_code');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('sub_services', 'sub_service_code', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    });
    // re-add index
    await queryInterface.addIndex('sub_services', ['sub_service_code']);
  }
};
