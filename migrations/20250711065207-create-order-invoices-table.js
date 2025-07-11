'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('order_invoices', {
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
      invoice_no: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      invoice_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      payment_terms: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      vat: {
        type: Sequelize.INTEGER(11),
        allowNull: false,
        defaultValue: 0,
      },
      discount: {
        type: Sequelize.INTEGER(11),
        allowNull: false,
        defaultValue: 0,
      },
      packing: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: '0',
      },
      asuransi: {
        type: Sequelize.INTEGER(11),
        allowNull: false,
        defaultValue: 0,
      },
      ppn: {
        type: Sequelize.INTEGER(11),
        allowNull: false,
        defaultValue: 0,
      },
      pph: {
        type: Sequelize.INTEGER(11),
        allowNull: false,
        defaultValue: 0,
      },
      kode_unik: {
        type: Sequelize.INTEGER(11),
        allowNull: false,
        defaultValue: 0,
      },
      konfirmasi_bayar: {
        type: Sequelize.INTEGER(11),
        allowNull: false,
        defaultValue: 0,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      beneficiary_name: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      acc_no: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      bank_name: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      bank_address: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      swift_code: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      paid_attachment: {
        type: Sequelize.STRING(250),
        allowNull: true,
      },
      payment_info: {
        type: Sequelize.INTEGER(11),
        allowNull: false,
      },
      fm: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      lm: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      bill_to_name: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      bill_to_phone: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      bill_to_address: {
        type: Sequelize.TEXT('long'),
        allowNull: true,
      },
      create_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
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
      isGrossUp: {
        type: Sequelize.INTEGER(11),
        allowNull: false,
        defaultValue: 0,
        comment: '0: Tidak | 1: Ya',
      },
      isUnreweight: {
        type: Sequelize.INTEGER(11),
        allowNull: false,
        defaultValue: 0,
        comment: '0: Tidak | 1: Iya',
      },
      noFaktur: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('order_invoices');
  }
};
