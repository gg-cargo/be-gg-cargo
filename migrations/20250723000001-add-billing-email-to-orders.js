'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('orders', 'billing_email', {
            type: Sequelize.STRING(255),
            allowNull: true,
            after: 'billing_phone'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('orders', 'billing_email');
    }
};
