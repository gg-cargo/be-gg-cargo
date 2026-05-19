'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('api_usage_log', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      service: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Nama service: google_routes, mapbox, dll',
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'Tanggal hit (YYYY-MM-DD)',
      },
      hit_count: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        comment: 'Jumlah hit hari ini',
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
    });

    await queryInterface.addIndex('api_usage_log', ['service', 'date'], {
      name: 'uq_api_usage_log_service_date',
      unique: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('api_usage_log');
  },
};
