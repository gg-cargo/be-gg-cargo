'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('order_shipments', {
      id: {
        type: Sequelize.BIGINT(20),
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      order_id: {
        type: Sequelize.BIGINT(20),
        allowNull: false,
        references: {
          model: 'orders',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      qty: {
        type: Sequelize.INTEGER(255),
        allowNull: false,
      },
      berat: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      panjang: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      lebar: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      tinggi: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      qty_reweight: {
        type: Sequelize.DOUBLE,
        allowNull: false,
        defaultValue: 0,
      },
      berat_reweight: {
        type: Sequelize.DOUBLE,
        allowNull: false,
        defaultValue: 0,
      },
      panjang_reweight: {
        type: Sequelize.DOUBLE,
        allowNull: false,
        defaultValue: 0,
      },
      lebar_reweight: {
        type: Sequelize.DOUBLE,
        allowNull: false,
        defaultValue: 0,
      },
      tinggi_reweight: {
        type: Sequelize.DOUBLE,
        allowNull: false,
        defaultValue: 0,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('order_shipments');
  }
};
