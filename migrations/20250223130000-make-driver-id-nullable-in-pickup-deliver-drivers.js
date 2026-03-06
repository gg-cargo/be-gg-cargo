'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // order_pickup_drivers - no FK, simple changeColumn
        await queryInterface.changeColumn('order_pickup_drivers', 'driver_id', {
            type: Sequelize.INTEGER,
            allowNull: true,
        });

        // order_deliver_drivers - has FK to users, try changeColumn first
        try {
            await queryInterface.changeColumn('order_deliver_drivers', 'driver_id', {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: true,
            });
        } catch (e) {
            // Fallback: drop FK, alter column, recreate FK (nullable, SET NULL on delete)
            const fkNames = ['order_deliver_drivers_ibfk_2', 'order_deliver_drivers_ibfk_1'];
            for (const name of fkNames) {
                try {
                    await queryInterface.removeConstraint('order_deliver_drivers', name);
                    break;
                } catch (_) { /* try next */ }
            }
            await queryInterface.changeColumn('order_deliver_drivers', 'driver_id', {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: true,
            });
            await queryInterface.addConstraint('order_deliver_drivers', {
                fields: ['driver_id'],
                type: 'foreign key',
                name: 'fk_order_deliver_drivers_driver_id',
                references: { table: 'users', field: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
            });
        }
    },

    async down(queryInterface, Sequelize) {
        // order_pickup_drivers - revert to NOT NULL
        await queryInterface.changeColumn('order_pickup_drivers', 'driver_id', {
            type: Sequelize.INTEGER,
            allowNull: false,
        });

        // order_deliver_drivers - revert to NOT NULL
        try {
            await queryInterface.changeColumn('order_deliver_drivers', 'driver_id', {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: false,
            });
        } catch (e) {
            try {
                await queryInterface.removeConstraint('order_deliver_drivers', 'fk_order_deliver_drivers_driver_id');
            } catch (_) { }
            await queryInterface.changeColumn('order_deliver_drivers', 'driver_id', {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: false,
            });
            await queryInterface.addConstraint('order_deliver_drivers', {
                fields: ['driver_id'],
                type: 'foreign key',
                name: 'order_deliver_drivers_ibfk_2',
                references: { table: 'users', field: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            });
        }
    },
};
