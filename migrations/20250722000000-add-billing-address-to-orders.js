'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('orders', 'billing_address', {
            type: Sequelize.TEXT,
            allowNull: true,
            comment: 'Alamat billing untuk invoice',
            after: 'billing_phone'
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('orders', 'billing_address');
    }
}; 