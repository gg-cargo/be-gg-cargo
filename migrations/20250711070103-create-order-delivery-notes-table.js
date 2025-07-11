'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('order_delivery_notes', {
      id: {
        type: Sequelize.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      no_delivery_note: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      tanggal: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      nama_pengirim: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      alamat_pengirim: {
        type: Sequelize.TEXT('medium'),
        allowNull: true,
      },
      no_telp_pengirim: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      nama_penerima: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      alamat_penerima: {
        type: Sequelize.TEXT('medium'),
        allowNull: true,
      },
      no_telp_penerima: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      transporter_id: {
        type: Sequelize.INTEGER(11),
        allowNull: false,
      },
      nama_transporter: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      jenis_kendaraan: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      no_polisi: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      hub_id: {
        type: Sequelize.INTEGER(11),
        allowNull: false,
      },
      agent_id: {
        type: Sequelize.INTEGER(11),
        allowNull: false,
      },
      status: {
        type: Sequelize.INTEGER(11),
        allowNull: false,
        defaultValue: 0,
      },
      hub_bypass: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      created_by: {
        type: Sequelize.INTEGER(11),
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      type: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'HUB',
        comment: 'HUB | MANIFEST',
      },
      no_tracking: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      totOrder: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      totPieceScan: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      totPieceAll: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      typeHub: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      updatedImage: {
        type: Sequelize.TEXT('long'),
        allowNull: true,
        comment: 'untuk update dropoff TP',
      },
      updatedLatlng: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'untuk update dropoff TP',
      },
      updatedBy: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'untuk update dropoff TP',
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('order_delivery_notes');
  }
};
