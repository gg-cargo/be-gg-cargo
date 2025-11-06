"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("orders", "vendor_tracking_number", {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: "Nomor resi/A-Waybill yang dikeluarkan oleh Vendor (JNE/TIKI/FTL, dll)",
      after: "vendor_id",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("orders", "vendor_tracking_number");
  },
};


