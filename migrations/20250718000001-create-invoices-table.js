'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('invoices', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            no_tracking: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            order_id: {
                type: Sequelize.INTEGER(11),
                allowNull: true,
            },
            invoice_no: {
                type: Sequelize.STRING(50),
                allowNull: true,
            },
            payment_status: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            kode_unik: {
                type: Sequelize.INTEGER(11),
                allowNull: true,
            },
            konfirmasi_bayar: {
                type: Sequelize.INTEGER(11),
                allowNull: true,
            },
            total: {
                type: Sequelize.DOUBLE,
                allowNull: true,
            },
            amount: {
                type: Sequelize.DOUBLE,
                allowNull: true,
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

        // Tambahkan index untuk optimasi query
        await queryInterface.addIndex('invoices', ['no_tracking']);
        await queryInterface.addIndex('invoices', ['order_id']);
        await queryInterface.addIndex('invoices', ['invoice_no']);
        await queryInterface.addIndex('invoices', ['payment_status']);
        await queryInterface.addIndex('invoices', ['created_at']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('invoices');
    }
}; 