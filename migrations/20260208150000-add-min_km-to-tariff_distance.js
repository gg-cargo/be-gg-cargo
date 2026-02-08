'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('tariff_distance', 'min_km', {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: true,
            after: 'rate_per_km'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('tariff_distance', 'min_km');
    }
};
