'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // USERS
    await queryInterface.addColumn('users', 'ktp_tempat_tanggal_lahir', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'ktp_jenis_kelamin', {
      type: Sequelize.STRING(25),
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'ktp_alamat', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'ktp_agama', {
      type: Sequelize.STRING(25),
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'ktp_status_perkawinan', {
      type: Sequelize.STRING(25),
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'sim_jenis', {
      type: Sequelize.STRING(15),
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'sim_nama_pemegang', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'url_foto_kurir_sim', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    // TRUCK LIST
    await queryInterface.addColumn('truck_list', 'kir_url', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn('truck_list', 'stnk_url', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    // EMERGENCY CONTACT TABLE
    await queryInterface.createTable('users_emergency_contact', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      nomor: { type: Sequelize.STRING(20), allowNull: false },
      keterangan: { type: Sequelize.STRING(50), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'ktp_tempat_tanggal_lahir');
    await queryInterface.removeColumn('users', 'ktp_jenis_kelamin');
    await queryInterface.removeColumn('users', 'ktp_alamat');
    await queryInterface.removeColumn('users', 'ktp_agama');
    await queryInterface.removeColumn('users', 'ktp_status_perkawinan');
    await queryInterface.removeColumn('users', 'sim_jenis');
    await queryInterface.removeColumn('users', 'sim_nama_pemegang');
    await queryInterface.removeColumn('users', 'url_foto_kurir_sim');
    await queryInterface.removeColumn('truck_list', 'kir_url');
    await queryInterface.removeColumn('truck_list', 'stnk_url');
    await queryInterface.dropTable('users_emergency_contact');
  }
};
