'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('vendors', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      nama_vendor: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      kode_vendor: {
        type: Sequelize.STRING(50),
        allowNull: true,
        unique: true,
      },
      alamat_vendor: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      pic_nama: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      pic_telepon: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      pic_email: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      jenis_layanan: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Array of service types: ["FTL", "LTL", "Kurir", "Internasional"]',
      },
      status_vendor: {
        type: Sequelize.ENUM('Aktif', 'Nonaktif', 'Dalam Proses'),
        allowNull: false,
        defaultValue: 'Dalam Proses',
      },
      area_coverage: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Array of cities/areas: ["Jakarta", "Bandung", "Surabaya"]',
      },
      catatan: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      aktif: {
        type: Sequelize.TINYINT,
        allowNull: false,
        defaultValue: 1,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    // Indexes
    await queryInterface.addIndex('vendors', ['kode_vendor'], {
      name: 'idx_vendors_kode',
      unique: true,
    });
    await queryInterface.addIndex('vendors', ['pic_email'], {
      name: 'idx_vendors_pic_email',
    });
    await queryInterface.addIndex('vendors', ['status_vendor'], {
      name: 'idx_vendors_status',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('vendors');
  },
};
