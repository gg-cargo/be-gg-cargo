"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("users", "transport_mode", {
      type: Sequelize.STRING(20),
      allowNull: true,
      comment: "Moda transporter: darat|laut|udara",
      after: "type_transporter",
    });

    await queryInterface.addColumn("users", "agent_name", {
      type: Sequelize.STRING(150),
      allowNull: true,
      comment: "Nama agent untuk moda laut/udara",
      after: "transport_mode",
    });

    await queryInterface.addColumn("users", "agent_address", {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: "Alamat agent untuk moda laut/udara",
      after: "agent_name",
    });

    await queryInterface.addColumn("users", "agent_city", {
      type: Sequelize.STRING(100),
      allowNull: true,
      comment: "Kota agent untuk moda laut/udara",
      after: "agent_address",
    });

    await queryInterface.addColumn("users", "agent_phone", {
      type: Sequelize.STRING(30),
      allowNull: true,
      comment: "No telepon agent untuk moda laut/udara",
      after: "agent_city",
    });

    await queryInterface.addColumn("users", "agent_email", {
      type: Sequelize.STRING(150),
      allowNull: true,
      comment: "Email agent untuk moda laut/udara",
      after: "agent_phone",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("users", "agent_email");
    await queryInterface.removeColumn("users", "agent_phone");
    await queryInterface.removeColumn("users", "agent_city");
    await queryInterface.removeColumn("users", "agent_address");
    await queryInterface.removeColumn("users", "agent_name");
    await queryInterface.removeColumn("users", "transport_mode");
  },
};

