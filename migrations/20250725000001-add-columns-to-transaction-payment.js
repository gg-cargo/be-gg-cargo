'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Add no_tracking (for easier joins and audits)
        await queryInterface.addColumn('transaction_payment', 'no_tracking', {
            type: Sequelize.STRING(255),
            allowNull: true,
            defaultValue: null,
            after: 'order_id'
        });

        // Add bank_name to store human readable bank
        await queryInterface.addColumn('transaction_payment', 'bank_name', {
            type: Sequelize.STRING(100),
            allowNull: true,
            defaultValue: null,
            after: 'bank_code'
        });

        // Optional index for quick lookup by no_tracking
        await queryInterface.addIndex('transaction_payment', ['no_tracking']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeIndex('transaction_payment', ['no_tracking']);
        await queryInterface.removeColumn('transaction_payment', 'bank_name');
        await queryInterface.removeColumn('transaction_payment', 'no_tracking');
    }
};


