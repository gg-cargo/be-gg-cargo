'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('customer_company_addresses', {
            id: {
                type: Sequelize.BIGINT.UNSIGNED,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false,
            },
            company_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: false,
                references: {
                    model: 'customer_companies',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            label: {
                type: Sequelize.STRING(100),
                allowNull: false,
                defaultValue: 'Kantor Pusat',
            },
            contact_name: {
                type: Sequelize.STRING(150),
                allowNull: true,
            },
            contact_phone: {
                type: Sequelize.STRING(30),
                allowNull: true,
            },
            contact_email: {
                type: Sequelize.STRING(150),
                allowNull: true,
            },
            address: {
                type: Sequelize.TEXT,
                allowNull: false,
            },
            province: {
                type: Sequelize.STRING(100),
                allowNull: true,
            },
            city: {
                type: Sequelize.STRING(100),
                allowNull: true,
            },
            district: {
                type: Sequelize.STRING(100),
                allowNull: true,
            },
            subdistrict: {
                type: Sequelize.STRING(100),
                allowNull: true,
            },
            postal_code: {
                type: Sequelize.STRING(20),
                allowNull: true,
            },
            location_text: {
                type: Sequelize.TEXT,
                allowNull: true,
                comment: 'Representasi lokasi yang dibaca user, mis. Banten, Tangerang, Poris',
            },
            lat: {
                type: Sequelize.DECIMAL(10, 7),
                allowNull: true,
            },
            lng: {
                type: Sequelize.DECIMAL(10, 7),
                allowNull: true,
            },
            is_primary: {
                type: Sequelize.TINYINT,
                allowNull: false,
                defaultValue: 1,
            },
            is_billing: {
                type: Sequelize.TINYINT,
                allowNull: false,
                defaultValue: 0,
            },
            is_pickup: {
                type: Sequelize.TINYINT,
                allowNull: false,
                defaultValue: 0,
            },
            is_return: {
                type: Sequelize.TINYINT,
                allowNull: false,
                defaultValue: 0,
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: true,
            },
        });

        await queryInterface.addIndex('customer_company_addresses', ['company_id'], {
            name: 'idx_customer_company_addresses_company_id',
        });
    },

    async down(queryInterface) {
        await queryInterface.removeIndex('customer_company_addresses', 'idx_customer_company_addresses_company_id');
        await queryInterface.dropTable('customer_company_addresses');
    },
};
