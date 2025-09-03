/* eslint-disable @typescript-eslint/no-var-requires */
'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('order_kendala', {
            id: {
                type: Sequelize.INTEGER(11),
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            order_id: {
                type: Sequelize.STRING(100),
                allowNull: true,
                defaultValue: null,
            },
            user_id: {
                type: Sequelize.STRING(100),
                allowNull: true,
                defaultValue: null,
            },
            message: {
                type: Sequelize.TEXT,
                allowNull: true,
                defaultValue: null,
            },
            message_completed: {
                type: Sequelize.TEXT,
                allowNull: true,
                defaultValue: null,
            },
            status: {
                type: Sequelize.INTEGER(11),
                allowNull: false,
                defaultValue: 0,
                comment: '0: Ongoing | 1: Completed',
            },
            created_at: {
                type: 'TIMESTAMP',
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            updated_at: {
                type: 'TIMESTAMP',
                allowNull: true,
                defaultValue: null,
            },
            code_image_1: {
                type: Sequelize.STRING(200),
                allowNull: true,
                defaultValue: null,
            },
            code_image_2: {
                type: Sequelize.STRING(200),
                allowNull: true,
                defaultValue: null,
            },
            code_image_3: {
                type: Sequelize.STRING(200),
                allowNull: true,
                defaultValue: null,
            },
            url_image_1: {
                type: Sequelize.TEXT,
                allowNull: true,
                defaultValue: null,
            },
            url_image_2: {
                type: Sequelize.TEXT,
                allowNull: true,
                defaultValue: null,
            },
            url_image_3: {
                type: Sequelize.TEXT,
                allowNull: true,
                defaultValue: null,
            },
            latlng: {
                type: Sequelize.TEXT,
                allowNull: true,
                defaultValue: null,
            },
            latlng_completed: {
                type: Sequelize.TEXT,
                allowNull: true,
                defaultValue: null,
            },
            location: {
                type: Sequelize.TEXT,
                allowNull: true,
                defaultValue: null,
            },
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable('order_kendala');
    },
};


