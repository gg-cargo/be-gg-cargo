'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('tariff_sea_freight', {
            sea_id: {
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
            origin_port: {
                type: Sequelize.STRING(200),
                allowNull: false,
                comment: 'Pelabuhan asal',
            },
            destination_port: {
                type: Sequelize.STRING(200),
                allowNull: false,
                comment: 'Pelabuhan tujuan',
            },
            rate_per_cbm: {
                type: Sequelize.DECIMAL(15, 2),
                allowNull: false,
                comment: 'Tarif per CBM (cubic meter)',
            },
            currency: {
                type: Sequelize.STRING(10),
                allowNull: false,
                defaultValue: 'USD',
                comment: 'Mata uang, e.g. USD, SGD',
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

        await queryInterface.addIndex('tariff_sea_freight', ['tariff_id']);
        await queryInterface.addIndex('tariff_sea_freight', ['origin_port', 'destination_port']);
    },

    async down(queryInterface /* , Sequelize */) {
        await queryInterface.dropTable('tariff_sea_freight');
    },
};
