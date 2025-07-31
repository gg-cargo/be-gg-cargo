'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('payment_order', {
            id: {
                type: Sequelize.STRING(100),
                primaryKey: true,
                allowNull: false,
            },
            order_id: {
                type: Sequelize.STRING(50),
                allowNull: true,
            },
            no_tracking: {
                type: Sequelize.STRING(100),
                allowNull: true,
            },
            kledo_id: {
                type: Sequelize.STRING(100),
                allowNull: true,
            },
            layanan: {
                type: Sequelize.STRING(100),
                allowNull: true,
            },
            amount: {
                type: Sequelize.TEXT,
                allowNull: true,
                defaultValue: '0',
            },
            bank_id: {
                type: Sequelize.STRING(50),
                allowNull: true,
            },
            bank_name: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            attachment: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            user_name: {
                type: Sequelize.STRING(100),
                allowNull: true,
            },
            user_id: {
                type: Sequelize.STRING(50),
                allowNull: true,
            },
            date: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
        });

        // Tambahkan index untuk optimasi query
        await queryInterface.addIndex('payment_order', ['order_id']);
        await queryInterface.addIndex('payment_order', ['no_tracking']);
        await queryInterface.addIndex('payment_order', ['user_id']);
        await queryInterface.addIndex('payment_order', ['created_at']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('payment_order');
    }
}; 