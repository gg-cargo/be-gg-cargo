'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('saldo', {
            id: {
                type: Sequelize.INTEGER(11),
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },
            user_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: false,
            },
            kode_referral: {
                type: Sequelize.STRING(20),
                allowNull: false,
            },
            pin: {
                type: Sequelize.INTEGER(11),
                allowNull: false,
                defaultValue: 0,
            },
            saldo: {
                type: Sequelize.INTEGER(11),
                allowNull: false,
            },
            saldo_dibekukan: {
                type: Sequelize.INTEGER(11),
                allowNull: false,
                defaultValue: 0,
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: true,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: true,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
            },
        });

        // Add indexes for better performance
        await queryInterface.addIndex('saldo', ['user_id']);
        await queryInterface.addIndex('saldo', ['kode_referral']);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('saldo');
    }
}; 