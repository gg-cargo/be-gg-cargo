'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('users_address', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            id_user: {
                type: Sequelize.BIGINT,
                allowNull: false,
            },
            nama: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            no_telepon: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            email: {
                type: Sequelize.STRING(255),
                allowNull: true,
                defaultValue: null,
            },
            alamat: {
                type: Sequelize.TEXT,
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
            svc_id: {
                type: Sequelize.STRING(100),
                allowNull: true,
                defaultValue: null,
            },
            hub_id: {
                type: Sequelize.STRING(100),
                allowNull: true,
                defaultValue: null,
            },
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('users_address');
    }
}; 