'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('transaction_payment', {
            id: {
                type: Sequelize.INTEGER(11),
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            user_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            order_id: {
                type: Sequelize.BIGINT,
                allowNull: false,
                references: {
                    model: 'orders',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            price: {
                type: Sequelize.STRING(250),
                allowNull: false,
            },
            sid: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            link_payment: {
                type: Sequelize.TEXT('long'),
                allowNull: false,
            },
            bank_code: {
                type: Sequelize.STRING(100),
                allowNull: true,
                defaultValue: null,
            },
            no_va: {
                type: Sequelize.STRING(100),
                allowNull: true,
                defaultValue: null,
            },
            expired_at: {
                type: Sequelize.STRING(100),
                allowNull: true,
                defaultValue: null,
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
            }
        });

        // Add indexes for better performance
        await queryInterface.addIndex('transaction_payment', ['user_id']);
        await queryInterface.addIndex('transaction_payment', ['order_id']);
        await queryInterface.addIndex('transaction_payment', ['sid']);
        await queryInterface.addIndex('transaction_payment', ['created_at']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('transaction_payment');
    }
};
