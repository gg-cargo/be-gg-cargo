'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('master_tarif', {
            tariff_id: {
                type: Sequelize.STRING(50),
                primaryKey: true,
                allowNull: false,
                comment: 'Primary key, e.g. TRF-001',
            },
            service_type: {
                type: Sequelize.ENUM('KIRIM_BARANG', 'KIRIM_MOTOR', 'SEWA_TRUK', 'INTERNATIONAL'),
                allowNull: false,
                comment: 'Jenis layanan',
            },
            sub_service: {
                type: Sequelize.ENUM('HEMAT', 'REGULER', 'PAKET', 'EXPRESS'),
                allowNull: false,
                comment: 'Sub-jenis layanan',
            },
            tariff_name: {
                type: Sequelize.STRING(200),
                allowNull: false,
                comment: 'Nama internal tarif',
            },
            pricing_model: {
                type: Sequelize.ENUM('WEIGHT_BASED', 'ROUTE_BASED', 'DISTANCE_BASED', 'DAILY_BASED'),
                allowNull: false,
                comment: 'Model pricing yang digunakan',
            },
            customer_id: {
                type: Sequelize.STRING(50),
                allowNull: true,
                comment: 'NULL = tarif umum, otherwise specific customer',
            },
            origin_zone: {
                type: Sequelize.STRING(100),
                allowNull: true,
                comment: 'Zona asal, e.g. JKT',
            },
            destination_zone: {
                type: Sequelize.STRING(100),
                allowNull: true,
                comment: 'Zona tujuan, e.g. BDG',
            },
            vehicle_type: {
                type: Sequelize.STRING(100),
                allowNull: true,
                comment: 'Tipe kendaraan (opsional)',
            },
            currency: {
                type: Sequelize.STRING(10),
                allowNull: false,
                defaultValue: 'IDR',
                comment: 'IDR / USD / SGD',
            },
            min_charge: {
                type: Sequelize.DECIMAL(15, 2),
                allowNull: false,
                defaultValue: 0,
                comment: 'Minimum charge',
            },
            sla_hours: {
                type: Sequelize.INTEGER,
                allowNull: true,
                comment: 'Service Level Agreement dalam jam',
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true,
                comment: 'Status aktif tarif',
            },
            effective_start: {
                type: Sequelize.DATEONLY,
                allowNull: false,
                comment: 'Tanggal mulai berlaku',
            },
            effective_end: {
                type: Sequelize.DATEONLY,
                allowNull: true,
                comment: 'Tanggal akhir berlaku, NULL = aktif selamanya',
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

        // Add indexes for common queries
        await queryInterface.addIndex('master_tarif', ['service_type']);
        await queryInterface.addIndex('master_tarif', ['sub_service']);
        await queryInterface.addIndex('master_tarif', ['pricing_model']);
        await queryInterface.addIndex('master_tarif', ['is_active']);
        await queryInterface.addIndex('master_tarif', ['customer_id']);
        await queryInterface.addIndex('master_tarif', ['origin_zone', 'destination_zone']);
    },

    async down(queryInterface /* , Sequelize */) {
        await queryInterface.dropTable('master_tarif');
    },
};
