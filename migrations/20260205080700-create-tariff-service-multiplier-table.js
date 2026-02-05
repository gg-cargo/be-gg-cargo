'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('tariff_service_multiplier', {
            multiplier_id: {
                type: Sequelize.STRING(50),
                primaryKey: true,
                allowNull: false,
            },
            sub_service: {
                type: Sequelize.ENUM('HEMAT', 'REGULER', 'PAKET', 'EXPRESS'),
                allowNull: false,
                unique: true,
                comment: 'Sub-service type',
            },
            multiplier: {
                type: Sequelize.DECIMAL(5, 2),
                allowNull: false,
                comment: 'Multiplier value, e.g. 1.4 for EXPRESS (40% increase)',
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: true,
            },
        });

        await queryInterface.addIndex('tariff_service_multiplier', ['sub_service']);
    },

    async down(queryInterface /* , Sequelize */) {
        await queryInterface.dropTable('tariff_service_multiplier');
    },
};
