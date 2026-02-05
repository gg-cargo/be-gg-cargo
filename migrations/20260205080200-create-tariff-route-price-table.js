'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('tariff_route_price', {
            route_price_id: {
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
            origin_city: {
                type: Sequelize.STRING(200),
                allowNull: false,
                comment: 'Kota asal',
            },
            destination_city: {
                type: Sequelize.STRING(200),
                allowNull: false,
                comment: 'Kota tujuan',
            },
            item_type: {
                type: Sequelize.STRING(100),
                allowNull: true,
                comment: 'Tipe item, e.g. MATIC, BEBEK, SPORT untuk motor',
            },
            price: {
                type: Sequelize.DECIMAL(15, 2),
                allowNull: false,
                comment: 'Harga tetap untuk rute ini',
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

        await queryInterface.addIndex('tariff_route_price', ['tariff_id']);
        await queryInterface.addIndex('tariff_route_price', ['origin_city', 'destination_city']);
    },

    async down(queryInterface /* , Sequelize */) {
        await queryInterface.dropTable('tariff_route_price');
    },
};
