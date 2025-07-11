'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('order_histories', {
      id: {
        type: Sequelize.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      order_id: {
        type: Sequelize.BIGINT(20),
        allowNull: false,
        references: { model: 'orders', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      status: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      provinsi: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      kota: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      time: {
        type: Sequelize.TIME,
        allowNull: true,
      },
      remark: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      parent_type: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      parent_id: {
        type: Sequelize.INTEGER(11),
        allowNull: false,
        defaultValue: 0,
      },
      parent_docs: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      created_by: {
        type: Sequelize.INTEGER(11),
        allowNull: false,
        defaultValue: 0,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      base64Foto: {
        type: Sequelize.TEXT('long'),
        allowNull: true,
      },
      base64SignDriver: {
        type: Sequelize.TEXT('long'),
        allowNull: true,
      },
      base64SignCustomer: {
        type: Sequelize.TEXT('long'),
        allowNull: true,
      },
      latlng: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      totPieceScan: {
        type: Sequelize.INTEGER(11),
        allowNull: true,
      },
      totPieceAll: {
        type: Sequelize.INTEGER(11),
        allowNull: true,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('order_histories');
  }
};
