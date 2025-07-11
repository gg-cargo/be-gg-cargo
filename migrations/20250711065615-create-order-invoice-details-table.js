'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('order_invoice_details', {
      id: {
        type: Sequelize.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      invoice_id: {
        type: Sequelize.INTEGER(11),
        allowNull: false,
        references: { model: 'order_invoices', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      qty: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      uom: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      unit_price: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      remark: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('order_invoice_details');
  }
};
