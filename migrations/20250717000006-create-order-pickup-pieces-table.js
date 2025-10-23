'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('order_pickup_pieces', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER(11)
            },
            order_pickup_id: {
                type: Sequelize.INTEGER(11),
                allowNull: false,
                references: {
                    model: 'order_pickup_drivers',
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
        try {
            await queryInterface.addIndex('order_pickup_pieces', ['order_pickup_id'], {
                name: 'order_pickup_pieces_order_pickup_id'
            });
        } catch (error) {
            // Index already exists, skip
        }

        try {
            await queryInterface.addIndex('order_pickup_pieces', ['order_id'], {
                name: 'order_pickup_pieces_order_id'
            });
        } catch (error) {
            // Index already exists, skip
        }

        try {
            await queryInterface.addIndex('order_pickup_pieces', ['order_piece_id'], {
                name: 'order_pickup_pieces_order_piece_id'
            });
        } catch (error) {
            // Index already exists, skip
        }

        // Composite index untuk query yang sering digunakan
        try {
            await queryInterface.addIndex('order_pickup_pieces', ['order_pickup_id', 'order_piece_id'], {
                name: 'order_pickup_pieces_composite'
            });
        } catch (error) {
            // Index already exists, skip
        }
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('order_pickup_pieces');
    }
};
