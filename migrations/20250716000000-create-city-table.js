"use strict";

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable("city", {
            id: {
                type: Sequelize.BIGINT,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false,
            },
            provinsi: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            kota: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            kecamatan: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            kelurahan: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            kode_pos: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: true,
                defaultValue: null,
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: true,
                defaultValue: null,
            },
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable("city");
    },
}; 