'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('order_manifest_inbound', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER(11)
            },
            order_id: {
                type: Sequelize.STRING(100),
                allowNull: true,
                defaultValue: null
            },
            svc_id: {
                type: Sequelize.STRING(100),
                allowNull: true,
                defaultValue: null
            },
            user_id: {
                type: Sequelize.STRING(100),
                allowNull: true,
                defaultValue: null
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('order_manifest_inbound');
    }
};
