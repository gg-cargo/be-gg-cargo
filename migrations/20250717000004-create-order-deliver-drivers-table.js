'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('order_deliver_drivers', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER(11)
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
            driver_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            assign_date: {
                type: Sequelize.DATE,
                allowNull: false
            },
            name: {
                type: Sequelize.STRING(200),
                allowNull: false
            },
            photo: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            notes: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            signature: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            status: {
                type: Sequelize.INTEGER(11),
                allowNull: false
            },
            svc_id: {
                type: Sequelize.STRING(100),
                allowNull: true
            },
            qty_scan: {
                type: Sequelize.INTEGER(11),
                allowNull: true
            },
            latlng: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            created_at: {
                allowNull: false,
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
            await queryInterface.addIndex('order_deliver_drivers', ['order_id'], {
                name: 'order_deliver_drivers_order_id'
            });
        } catch (error) {
            // Index already exists, skip
        }

        try {
            await queryInterface.addIndex('order_deliver_drivers', ['driver_id'], {
                name: 'order_deliver_drivers_driver_id'
            });
        } catch (error) {
            // Index already exists, skip
        }

        try {
            await queryInterface.addIndex('order_deliver_drivers', ['status'], {
                name: 'order_deliver_drivers_status'
            });
        } catch (error) {
            // Index already exists, skip
        }

        try {
            await queryInterface.addIndex('order_deliver_drivers', ['assign_date'], {
                name: 'order_deliver_drivers_assign_date'
            });
        } catch (error) {
            // Index already exists, skip
        }
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('order_deliver_drivers');
    }
};
