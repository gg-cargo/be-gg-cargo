'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('customer_company_members', {
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
            user_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            role: {
                type: Sequelize.STRING(30),
                allowNull: false,
                defaultValue: 'owner',
                comment: 'owner | admin | finance | operator | viewer',
            },
            is_primary_pic: {
                type: Sequelize.TINYINT,
                allowNull: false,
                defaultValue: 0,
            },
            is_active: {
                type: Sequelize.TINYINT,
                allowNull: false,
                defaultValue: 1,
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

        await queryInterface.addIndex('customer_company_members', ['company_id', 'user_id'], {
            name: 'uq_customer_company_members_company_user',
            unique: true,
        });
        await queryInterface.addIndex('customer_company_members', ['user_id'], {
            name: 'idx_customer_company_members_user_id',
        });
    },

    async down(queryInterface) {
        await queryInterface.removeIndex('customer_company_members', 'idx_customer_company_members_user_id');
        await queryInterface.removeIndex('customer_company_members', 'uq_customer_company_members_company_user');
        await queryInterface.dropTable('customer_company_members');
    },
};
