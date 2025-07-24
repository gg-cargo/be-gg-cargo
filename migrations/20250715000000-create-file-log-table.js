"use strict";

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable("file_log", {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false,
            },
            user_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                comment: "Uploader user ID",
            },
            file_name: {
                type: Sequelize.STRING(255),
                allowNull: false,
                comment: "Nama asli file",
            },
            file_path: {
                type: Sequelize.TEXT,
                allowNull: false,
                comment: "Path atau URL file yang disimpan",
            },
            file_type: {
                type: Sequelize.STRING(50),
                allowNull: true,
                comment: "e.g. pdf, jpg, png",
            },
            file_size: {
                type: Sequelize.INTEGER,
                allowNull: true,
                comment: "Ukuran dalam bytes",
            },
            is_assigned: {
                type: Sequelize.TINYINT,
                allowNull: false,
                defaultValue: 0,
                comment: "0: belum dipakai, 1: sudah dipakai",
            },
            used_for: {
                type: Sequelize.STRING(100),
                allowNull: true,
                comment: "Contoh: surat_jalan_balik, bukti_transfer, dll",
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: true,
                defaultValue: null,
                onUpdate: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable("file_log");
    },
}; 