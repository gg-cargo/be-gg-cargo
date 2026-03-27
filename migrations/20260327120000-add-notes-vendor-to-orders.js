"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("orders", "notes_vendor", {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: "Catatan internal terkait vendor / forward",
      after: "vendor_tracking_number",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("orders", "notes_vendor");
  },
};
