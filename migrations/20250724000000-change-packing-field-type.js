'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.changeColumn('order_invoices', 'packing', {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.changeColumn('order_invoices', 'packing', {
            type: Sequelize.STRING(50),
            allowNull: false,
            defaultValue: '0'
        });
    }
};
