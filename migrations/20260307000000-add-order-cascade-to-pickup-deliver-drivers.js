'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // 0. Hapus baris orphan (order_id tidak ada di orders) agar FK bisa ditambahkan
        await queryInterface.sequelize.query(`
            DELETE opd FROM order_pickup_drivers opd
            LEFT JOIN orders o ON opd.order_id = o.id
            WHERE o.id IS NULL
        `);
        await queryInterface.sequelize.query(`
            DELETE odd FROM order_deliver_drivers odd
            LEFT JOIN orders o ON odd.order_id = o.id
            WHERE o.id IS NULL
        `);

        // 1. order_pickup_drivers: tambah FK order_id -> orders.id dengan ON DELETE CASCADE
        // Tabel ini TIDAK punya FK di migration awal - sehingga delete order tidak cascade
        try {
            await queryInterface.changeColumn('order_pickup_drivers', 'order_id', {
                type: Sequelize.BIGINT,
                allowNull: false,
            });
        } catch (e) {
            // Kolom mungkin sudah BIGINT
        }

        try {
            await queryInterface.addConstraint('order_pickup_drivers', {
                fields: ['order_id'],
                type: 'foreign key',
                name: 'fk_order_pickup_drivers_order_id',
                references: { table: 'orders', field: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            });
        } catch (e) {
            if (!e.message?.includes('Duplicate') && !e.message?.includes('already exists')) {
                throw e;
            }
        }

        // 2. order_deliver_drivers: migration create sudah punya onDelete CASCADE.
        // Jika FK tidak ada (DB lama/corrupt), tambahkan.
        const [rows] = await queryInterface.sequelize.query(
            `SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE 
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_deliver_drivers' 
             AND COLUMN_NAME = 'order_id' AND REFERENCED_TABLE_NAME = 'orders'`
        );
        if (!rows || rows.length === 0) {
            try {
                await queryInterface.addConstraint('order_deliver_drivers', {
                    fields: ['order_id'],
                    type: 'foreign key',
                    name: 'fk_order_deliver_drivers_order_id',
                    references: { table: 'orders', field: 'id' },
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE',
                });
            } catch (e) {
                if (!e.message?.includes('Duplicate') && !e.message?.includes('already exists')) {
                    throw e;
                }
            }
        }
    },

    async down(queryInterface, Sequelize) {
        try {
            await queryInterface.removeConstraint('order_pickup_drivers', 'fk_order_pickup_drivers_order_id');
        } catch (_) {}

        try {
            await queryInterface.changeColumn('order_pickup_drivers', 'order_id', {
                type: Sequelize.INTEGER,
                allowNull: false,
            });
        } catch (_) {}
    },
};
