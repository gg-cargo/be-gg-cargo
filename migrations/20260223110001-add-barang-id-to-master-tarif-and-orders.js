'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('master_tarif', 'barang_id', {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'barang', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
        });

        await queryInterface.addColumn('orders', 'barang_id', {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'barang', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
        });

        await queryInterface.addIndex('master_tarif', ['barang_id'], { name: 'idx_master_tarif_barang_id' });
        await queryInterface.addIndex('orders', ['barang_id'], { name: 'idx_orders_barang_id' });
    },

    async down(queryInterface) {
        await queryInterface.removeIndex('master_tarif', 'idx_master_tarif_barang_id');
        await queryInterface.removeIndex('orders', 'idx_orders_barang_id');
        await queryInterface.removeColumn('master_tarif', 'barang_id');
        await queryInterface.removeColumn('orders', 'barang_id');
    },
};
