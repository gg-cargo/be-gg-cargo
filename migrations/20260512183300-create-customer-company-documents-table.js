'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('customer_company_documents', {
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
            document_type: {
                type: Sequelize.STRING(30),
                allowNull: false,
                comment: 'nib | siup | nib_siup | npwp | akta | other',
            },
            document_number: {
                type: Sequelize.STRING(100),
                allowNull: true,
            },
            file_log_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'file_log',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
            },
            status: {
                type: Sequelize.STRING(30),
                allowNull: false,
                defaultValue: 'uploaded',
                comment: 'uploaded | verified | rejected | expired',
            },
            verified_by: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
            },
            verified_at: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            rejection_reason: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            expired_at: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            metadata: {
                type: Sequelize.TEXT,
                allowNull: true,
                comment: 'Metadata tambahan dokumen dalam format JSON string jika diperlukan',
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

        await queryInterface.addIndex('customer_company_documents', ['company_id', 'document_type'], {
            name: 'idx_customer_company_documents_company_type',
        });
        await queryInterface.addIndex('customer_company_documents', ['file_log_id'], {
            name: 'idx_customer_company_documents_file_log_id',
        });
        await queryInterface.addIndex('customer_company_documents', ['status'], {
            name: 'idx_customer_company_documents_status',
        });
    },

    async down(queryInterface) {
        await queryInterface.removeIndex('customer_company_documents', 'idx_customer_company_documents_status');
        await queryInterface.removeIndex('customer_company_documents', 'idx_customer_company_documents_file_log_id');
        await queryInterface.removeIndex('customer_company_documents', 'idx_customer_company_documents_company_type');
        await queryInterface.dropTable('customer_company_documents');
    },
};
