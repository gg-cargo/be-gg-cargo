'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Tambahkan kolom yang hilang untuk international orders
    try {
      await queryInterface.addColumn('orders', 'tipe_pengiriman', {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Tipe pengiriman: Barang atau Dokumen'
      });
    } catch (error) {
      // Column already exists, skip
    }

    try {
      await queryInterface.addColumn('orders', 'jenis_pengirim', {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Jenis pengirim: Personal atau Perusahaan'
      });
    } catch (error) {
      // Column already exists, skip
    }

    try {
      await queryInterface.addColumn('orders', 'negara_pengirim', {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Negara pengirim'
      });
    } catch (error) {
      // Column already exists, skip
    }

    try {
      await queryInterface.addColumn('orders', 'peb_number', {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Nomor PEB (Pemberitahuan Ekspor Barang)'
      });
    } catch (error) {
      // Column already exists, skip
    }

    try {
      await queryInterface.addColumn('orders', 'jenis_penerima', {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Jenis penerima: Personal atau Perusahaan'
      });
    } catch (error) {
      // Column already exists, skip
    }

    try {
      await queryInterface.addColumn('orders', 'negara_penerima', {
        type: Sequelize.STRING(10),
        allowNull: true,
        comment: 'Kode negara penerima (e.g., US, SG)'
      });
    } catch (error) {
      // Column already exists, skip
    }

    try {
      await queryInterface.addColumn('orders', 'kodepos_internasional', {
        type: Sequelize.STRING(10),
        allowNull: true,
        comment: 'Kode pos internasional'
      });
    } catch (error) {
      // Column already exists, skip
    }

    try {
      await queryInterface.addColumn('orders', 'hs_code', {
        type: Sequelize.STRING(20),
        allowNull: true,
        comment: 'Harmonized System Code'
      });
    } catch (error) {
      // Column already exists, skip
    }

    try {
      await queryInterface.addColumn('orders', 'country_of_origin', {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Negara asal barang'
      });
    } catch (error) {
      // Column already exists, skip
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('orders', 'tipe_pengiriman');
    await queryInterface.removeColumn('orders', 'jenis_pengirim');
    await queryInterface.removeColumn('orders', 'negara_pengirim');
    await queryInterface.removeColumn('orders', 'peb_number');
    await queryInterface.removeColumn('orders', 'jenis_penerima');
    await queryInterface.removeColumn('orders', 'negara_penerima');
    await queryInterface.removeColumn('orders', 'kodepos_internasional');
    await queryInterface.removeColumn('orders', 'hs_code');
    await queryInterface.removeColumn('orders', 'country_of_origin');
  }
};