'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        try {
            await queryInterface.addColumn('orders', 'billing_email', {
                type: Sequelize.STRING(255),
                allowNull: true,
                after: 'billing_phone'
            });
        } catch (error) {
            // Column already exists, skip
        }
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('orders', 'billing_email');
    }
};
