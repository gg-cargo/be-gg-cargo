'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('reweight_correction_requests', {
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
            piece_id: {
                type: Sequelize.INTEGER(11),
                allowNull: false,
                references: {
                    model: 'order_pieces',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            current_berat: {
                type: Sequelize.DOUBLE,
                allowNull: false,
                comment: 'Berat saat ini sebelum koreksi'
            },
            current_panjang: {
                type: Sequelize.DOUBLE,
                allowNull: false,
                comment: 'Panjang saat ini sebelum koreksi'
            },
            current_lebar: {
                type: Sequelize.DOUBLE,
                allowNull: false,
                comment: 'Lebar saat ini sebelum koreksi'
            },
            current_tinggi: {
                type: Sequelize.DOUBLE,
                allowNull: false,
                comment: 'Tinggi saat ini sebelum koreksi'
            },
            new_berat: {
                type: Sequelize.DOUBLE,
                allowNull: false,
                comment: 'Berat baru yang diminta'
            },
            new_panjang: {
                type: Sequelize.DOUBLE,
                allowNull: false,
                comment: 'Panjang baru yang diminta'
            },
            new_lebar: {
                type: Sequelize.DOUBLE,
                allowNull: false,
                comment: 'Lebar baru yang diminta'
            },
            new_tinggi: {
                type: Sequelize.DOUBLE,
                allowNull: false,
                comment: 'Tinggi baru yang diminta'
            },
            note: {
                type: Sequelize.STRING(35),
                allowNull: false,
                comment: 'Catatan koreksi (maks 35 karakter)'
            },
            alasan_koreksi: {
                type: Sequelize.TEXT,
                allowNull: true,
                comment: 'Alasan detail koreksi'
            },
            status: {
                type: Sequelize.INTEGER(11),
                allowNull: false,
                defaultValue: 0,
                comment: '0: pending, 1: approved, 2: rejected'
            },
            requested_by: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            approved_by: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            approved_at: {
                type: Sequelize.DATE,
                allowNull: true
            },
            rejection_reason: {
                type: Sequelize.TEXT,
                allowNull: true,
                comment: 'Alasan penolakan jika status = 2'
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
            }
        });

        // Tambahkan index untuk performa query
        await queryInterface.addIndex('reweight_correction_requests', ['order_id']);
        await queryInterface.addIndex('reweight_correction_requests', ['piece_id']);
        await queryInterface.addIndex('reweight_correction_requests', ['status']);
        await queryInterface.addIndex('reweight_correction_requests', ['requested_by']);
        await queryInterface.addIndex('reweight_correction_requests', ['created_at']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('reweight_correction_requests');
    }
};
