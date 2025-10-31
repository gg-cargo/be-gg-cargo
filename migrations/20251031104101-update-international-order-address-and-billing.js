'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('orders', 'provinsi_pengirim', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    await queryInterface.changeColumn('orders', 'kecamatan_pengirim', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    await queryInterface.changeColumn('orders', 'kelurahan_pengirim', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    await queryInterface.changeColumn('orders', 'provinsi_penerima', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    await queryInterface.changeColumn('orders', 'kecamatan_penerima', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    await queryInterface.changeColumn('orders', 'kelurahan_penerima', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    await queryInterface.addColumn('orders', 'incoterms', {
      type: Sequelize.STRING(20),
      allowNull: true,
      after: 'negara_penerima',
    });

    await queryInterface.addColumn('orders', 'penagih_email', {
      type: Sequelize.STRING(100),
      allowNull: true,
      after: 'incoterms',
    });

    await queryInterface.addColumn('orders', 'penagih_kodepos', {
      type: Sequelize.STRING(20),
      allowNull: true,
      after: 'penagih_email',
    });

    await queryInterface.addColumn('orders', 'penagih_kota', {
      type: Sequelize.STRING(100),
      allowNull: true,
      after: 'penagih_kodepos',
    });

    await queryInterface.addColumn('orders', 'penagih_nama_pt', {
      type: Sequelize.STRING(150),
      allowNull: true,
      after: 'penagih_kota',
    });

    await queryInterface.addColumn('orders', 'penagih_negara', {
      type: Sequelize.STRING(100),
      allowNull: true,
      after: 'penagih_nama_pt',
    });

    await queryInterface.addColumn('orders', 'penagih_phone', {
      type: Sequelize.STRING(20),
      allowNull: true,
      after: 'penagih_negara',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('orders', 'penagih_phone');
    await queryInterface.removeColumn('orders', 'penagih_negara');
    await queryInterface.removeColumn('orders', 'penagih_nama_pt');
    await queryInterface.removeColumn('orders', 'penagih_kota');
    await queryInterface.removeColumn('orders', 'penagih_kodepos');
    await queryInterface.removeColumn('orders', 'penagih_email');
    await queryInterface.removeColumn('orders', 'incoterms');

    await queryInterface.changeColumn('orders', 'kelurahan_penerima', {
      type: Sequelize.STRING(255),
      allowNull: false,
    });

    await queryInterface.changeColumn('orders', 'kecamatan_penerima', {
      type: Sequelize.STRING(255),
      allowNull: false,
    });

    await queryInterface.changeColumn('orders', 'provinsi_penerima', {
      type: Sequelize.STRING(255),
      allowNull: false,
    });

    await queryInterface.changeColumn('orders', 'kelurahan_pengirim', {
      type: Sequelize.STRING(255),
      allowNull: false,
    });

    await queryInterface.changeColumn('orders', 'kecamatan_pengirim', {
      type: Sequelize.STRING(255),
      allowNull: false,
    });

    await queryInterface.changeColumn('orders', 'provinsi_pengirim', {
      type: Sequelize.STRING(255),
      allowNull: false,
    });
  }
};
