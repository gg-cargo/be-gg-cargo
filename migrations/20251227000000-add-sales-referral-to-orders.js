'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('orders', 'sales_referral_code', {
            type: Sequelize.STRING(25),
            allowNull: true,
            after: 'order_by',
            comment: 'Kode referral sales yang digunakan customer saat order'
        });

        await queryInterface.addColumn('orders', 'referred_by_sales_id', {
            type: Sequelize.BIGINT.UNSIGNED,
            allowNull: true,
            after: 'sales_referral_code',
            references: {
                model: 'users',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
            comment: 'ID user sales yang me-refer order ini'
        });

        // Add indexes for better query performance
        await queryInterface.addIndex('orders', ['sales_referral_code'], {
            name: 'idx_orders_sales_referral_code'
        });

        await queryInterface.addIndex('orders', ['referred_by_sales_id'], {
            name: 'idx_orders_referred_by_sales_id'
        });
    },

    down: async (queryInterface, Sequelize) => {
        // Remove indexes first
        await queryInterface.removeIndex('orders', 'idx_orders_sales_referral_code');
        await queryInterface.removeIndex('orders', 'idx_orders_referred_by_sales_id');

        // Remove columns
        await queryInterface.removeColumn('orders', 'referred_by_sales_id');
        await queryInterface.removeColumn('orders', 'sales_referral_code');
    }
};

