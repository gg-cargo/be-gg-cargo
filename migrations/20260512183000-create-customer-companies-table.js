'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('customer_companies', {
            id: {
                type: Sequelize.BIGINT.UNSIGNED,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false,
            },
            company_code: {
                type: Sequelize.STRING(30),
                allowNull: false,
                comment: 'Kode unik perusahaan customer B2B',
            },
            company_name: {
                type: Sequelize.STRING(200),
                allowNull: false,
                comment: 'Nama perusahaan yang tampil di aplikasi',
            },
            legal_name: {
                type: Sequelize.STRING(200),
                allowNull: true,
                comment: 'Nama legal perusahaan bila berbeda dari nama tampil',
            },
            company_email: {
                type: Sequelize.STRING(150),
                allowNull: true,
            },
            company_phone: {
                type: Sequelize.STRING(30),
                allowNull: true,
            },
            company_type: {
                type: Sequelize.STRING(30),
                allowNull: false,
                defaultValue: 'b2b',
                comment: 'Tipe perusahaan/customer, default b2b',
            },
            status: {
                type: Sequelize.STRING(30),
                allowNull: false,
                defaultValue: 'draft',
                comment: 'draft | submitted | verified | rejected | suspended',
            },
            payment_terms_days: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            discount_rate: {
                type: Sequelize.DECIMAL(5, 2),
                allowNull: false,
                defaultValue: 0,
            },
            credit_limit: {
                type: Sequelize.DECIMAL(18, 2),
                allowNull: false,
                defaultValue: 0,
            },
            referred_by_sales_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
                comment: 'User sales yang mereferensikan perusahaan ini',
            },
            referral_code_input: {
                type: Sequelize.STRING(25),
                allowNull: true,
                comment: 'Kode referral sales yang diinput saat registrasi',
            },
            sales_linked_at: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            notes: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            rejection_reason: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            created_by: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
            },
            updated_by: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
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
            deleted_at: {
                type: Sequelize.DATE,
                allowNull: true,
            },
        });

        await queryInterface.addIndex('customer_companies', ['company_code'], {
            name: 'uq_customer_companies_company_code',
            unique: true,
        });
        await queryInterface.addIndex('customer_companies', ['status'], {
            name: 'idx_customer_companies_status',
        });
        await queryInterface.addIndex('customer_companies', ['referred_by_sales_id'], {
            name: 'idx_customer_companies_referred_by_sales_id',
        });
        await queryInterface.addIndex('customer_companies', ['created_by'], {
            name: 'idx_customer_companies_created_by',
        });
    },

    async down(queryInterface) {
        await queryInterface.removeIndex('customer_companies', 'idx_customer_companies_created_by');
        await queryInterface.removeIndex('customer_companies', 'idx_customer_companies_referred_by_sales_id');
        await queryInterface.removeIndex('customer_companies', 'idx_customer_companies_status');
        await queryInterface.removeIndex('customer_companies', 'uq_customer_companies_company_code');
        await queryInterface.dropTable('customer_companies');
    },
};
