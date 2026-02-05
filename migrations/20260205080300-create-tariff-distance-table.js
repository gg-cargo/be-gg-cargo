'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('tariff_distance', {
            distance_id: {
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
            base_price: {
                type: Sequelize.DECIMAL(15, 2),
                allowNull: false,
                comment: 'Harga dasar',
            },
            rate_per_km: {
                type: Sequelize.DECIMAL(15, 2),
                allowNull: false,
                comment: 'Tarif per kilometer',
            },
            max_km: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: true,
                comment: 'Maksimum kilometer (opsional)',
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

        await queryInterface.addIndex('tariff_distance', ['tariff_id']);
    },

    async down(queryInterface /* , Sequelize */) {
        await queryInterface.dropTable('tariff_distance');
    },
};
