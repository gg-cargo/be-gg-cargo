'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('tariff_surcharge', {
            surcharge_id: {
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
            surcharge_type: {
                type: Sequelize.STRING(100),
                allowNull: false,
                comment: 'Tipe surcharge, e.g. FUEL, INSURANCE, HANDLING',
            },
            calculation: {
                type: Sequelize.ENUM('PERCENT', 'FIXED'),
                allowNull: false,
                comment: 'Cara kalkulasi: PERCENT atau FIXED amount',
            },
            value: {
                type: Sequelize.DECIMAL(15, 2),
                allowNull: false,
                comment: 'Nilai surcharge (% atau nominal)',
            },
            condition: {
                type: Sequelize.TEXT,
                allowNull: true,
                comment: 'Kondisi penerapan surcharge, e.g. DISTANCE>300',
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

        await queryInterface.addIndex('tariff_surcharge', ['tariff_id']);
        await queryInterface.addIndex('tariff_surcharge', ['surcharge_type']);
    },

    async down(queryInterface /* , Sequelize */) {
        await queryInterface.dropTable('tariff_surcharge');
    },
};
