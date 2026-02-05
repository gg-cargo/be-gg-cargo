'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('tariff_weight_tier', {
            tier_id: {
                type: Sequelize.STRING(50),
                primaryKey: true,
                allowNull: false,
            },
            tariff_id: {
                type: Sequelize.STRING(50),
                allowNull: false,
                references: {
                    model: 'master_tarif',
                    key: 'tariff_id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
                comment: 'Foreign key ke master_tarif',
            },
            min_weight_kg: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0,
                comment: 'Berat minimum dalam kg',
            },
            max_weight_kg: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
                comment: 'Berat maksimum dalam kg',
            },
            rate_per_kg: {
                type: Sequelize.DECIMAL(15, 2),
                allowNull: false,
                comment: 'Tarif per kg',
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

        await queryInterface.addIndex('tariff_weight_tier', ['tariff_id']);
    },

    async down(queryInterface /* , Sequelize */) {
        await queryInterface.dropTable('tariff_weight_tier');
    },
};
