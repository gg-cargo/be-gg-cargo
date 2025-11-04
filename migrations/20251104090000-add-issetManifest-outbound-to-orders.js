"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("orders", "issetManifest_outbound", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      after: "issetManifest_inbound",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("orders", "issetManifest_outbound");
  },
};


