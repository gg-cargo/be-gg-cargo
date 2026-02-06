'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // 1. SERVICES Table
        await queryInterface.createTable('services', {
            service_id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                allowNull: false
            },
            service_code: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true
            },
            service_name: {
                type: Sequelize.STRING,
                allowNull: false
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            is_international: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
                allowNull: false
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                defaultValue: true,
                allowNull: false
            },
            sort_order: {
                type: Sequelize.INTEGER,
                defaultValue: 0,
                allowNull: false
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });

        // 2. SUB_SERVICES Table
        await queryInterface.createTable('sub_services', {
            sub_service_id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                allowNull: false
            },
            service_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'services',
                    key: 'service_id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            sub_service_code: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true
            },
            sub_service_name: {
                type: Sequelize.STRING,
                allowNull: false
            },
            sla_hours: {
                type: Sequelize.INTEGER,
                allowNull: true
            },
            pricing_type: {
                type: Sequelize.ENUM('WEIGHT', 'ROUTE', 'DISTANCE', 'DAILY'),
                allowNull: false
            },
            default_multiplier: {
                type: Sequelize.DECIMAL(10, 2), // Precision 10, Scale 2
                defaultValue: 1.00,
                allowNull: false
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                defaultValue: true,
                allowNull: false
            },
            sort_order: {
                type: Sequelize.INTEGER,
                defaultValue: 0,
                allowNull: false
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });

        // Add indexes for performance
        await queryInterface.addIndex('services', ['service_code']);
        await queryInterface.addIndex('sub_services', ['service_id']);
        await queryInterface.addIndex('sub_services', ['sub_service_code']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('sub_services');
        await queryInterface.dropTable('services');
    }
};
