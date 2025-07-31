'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('banks', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER(11)
            },
            no_account: {
                type: Sequelize.STRING(200),
                allowNull: false
            },
            account_name: {
                type: Sequelize.STRING(200),
                allowNull: false
            },
            bank_name: {
                type: Sequelize.STRING(50),
                allowNull: false
            },
            image: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
                allowNull: true,
                type: Sequelize.DATE,
                defaultValue: null
            }
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('banks');
    }
}; 