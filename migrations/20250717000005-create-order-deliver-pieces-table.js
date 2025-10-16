'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('order_deliver_pieces', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER(11)
            },
            order_deliver_id: {
                type: Sequelize.INTEGER(11),
                allowNull: false,
                references: {
                    model: 'order_deliver_drivers',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            order_id: {
                type: Sequelize.BIGINT(20),
                allowNull: false,
                references: {
                    model: 'orders',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            order_piece_id: {
                type: Sequelize.INTEGER(11),
                allowNull: false,
                references: {
                    model: 'order_pieces',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            created_at: {
                allowNull: true,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
                allowNull: true,
                type: Sequelize.DATE
            }
        });

        // Tambahkan index untuk performa query
        await queryInterface.addIndex('order_deliver_pieces', ['order_deliver_id']);
        await queryInterface.addIndex('order_deliver_pieces', ['order_id']);
        await queryInterface.addIndex('order_deliver_pieces', ['order_piece_id']);

        // Composite index untuk query yang sering digunakan
        await queryInterface.addIndex('order_deliver_pieces', ['order_deliver_id', 'order_piece_id']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('order_deliver_pieces');
    }
};
