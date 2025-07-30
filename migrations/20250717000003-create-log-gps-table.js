'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('log_gps', {
            id: {
                type: Sequelize.INTEGER(11),
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            user_id: {
                type: Sequelize.STRING(100),
                allowNull: true,
                defaultValue: null,
            },
            latlng: {
                type: Sequelize.STRING(100),
                allowNull: true,
                defaultValue: null,
            },
            type: {
                type: Sequelize.STRING(100),
                allowNull: true,
                defaultValue: null,
            },
            ip_address: {
                type: Sequelize.STRING(200),
                allowNull: true,
                defaultValue: null,
            },
            provider: {
                type: Sequelize.STRING(200),
                allowNull: true,
                defaultValue: null,
            },
            country: {
                type: Sequelize.STRING(200),
                allowNull: true,
                defaultValue: null,
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('log_gps');
    }
}; 