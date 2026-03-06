'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('city', 'hub_origin', {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'hubs', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
        });

        await queryInterface.addIndex('city', ['hub_origin'], { name: 'idx_city_hub_origin' });
    },

    async down(queryInterface) {
        await queryInterface.removeIndex('city', 'idx_city_hub_origin');
        await queryInterface.removeColumn('city', 'hub_origin');
    },
};
