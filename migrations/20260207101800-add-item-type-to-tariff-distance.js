'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('tariff_distance', 'item_type', {
            type: Sequelize.STRING(100),
            allowNull: true,
            comment: 'Tipe item (e.g., Document, Package, etc.)',
            after: 'max_km',
        });

        // Add index for better query performance
        await queryInterface.addIndex('tariff_distance', ['item_type']);
    },

    async down(queryInterface /* , Sequelize */) {
        await queryInterface.removeIndex('tariff_distance', ['item_type']);
        await queryInterface.removeColumn('tariff_distance', 'item_type');
    },
};
