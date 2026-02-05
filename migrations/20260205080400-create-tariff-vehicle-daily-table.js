'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('tariff_vehicle_daily', {
            daily_id: {
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
            vehicle_type: {
                type: Sequelize.STRING(100),
                allowNull: false,
                comment: 'Tipe kendaraan, e.g. CDD, ENGKEL, FUSO',
            },
            daily_rate: {
                type: Sequelize.DECIMAL(15, 2),
                allowNull: false,
                comment: 'Tarif harian',
            },
            max_hours: {
                type: Sequelize.INTEGER,
                allowNull: true,
                comment: 'Maksimum jam per hari',
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

        await queryInterface.addIndex('tariff_vehicle_daily', ['tariff_id']);
        await queryInterface.addIndex('tariff_vehicle_daily', ['vehicle_type']);
    },

    async down(queryInterface /* , Sequelize */) {
        await queryInterface.dropTable('tariff_vehicle_daily');
    },
};
