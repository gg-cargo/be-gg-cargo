"use strict";

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable("hubs", {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false,
            },
            kode: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            nama: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            alamat: {
                type: Sequelize.TEXT,
                allowNull: false,
            },
            phone: {
                type: Sequelize.STRING(20),
                allowNull: false,
            },
            lokasi: {
                type: Sequelize.STRING(250),
                allowNull: true,
                defaultValue: null,
            },
            latLang: {
                type: Sequelize.STRING(200),
                allowNull: true,
                defaultValue: null,
            },
            group_id: {
                type: Sequelize.STRING(100),
                allowNull: true,
                defaultValue: null,
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            src_sound: {
                type: Sequelize.TEXT,
                allowNull: true,
                defaultValue: null,
            },
            code_dn: {
                type: Sequelize.TEXT,
                allowNull: true,
                defaultValue: null,
            },
        });

        // Tambahkan index untuk optimasi query
        await queryInterface.addIndex('hubs', ['kode'], {
            name: 'idx_hubs_kode'
        });

        await queryInterface.addIndex('hubs', ['nama'], {
            name: 'idx_hubs_nama'
        });

        await queryInterface.addIndex('hubs', ['group_id'], {
            name: 'idx_hubs_group_id'
        });

        await queryInterface.addIndex('hubs', ['lokasi'], {
            name: 'idx_hubs_lokasi'
        });

        // Composite index untuk pencarian berdasarkan group dan kode
        await queryInterface.addIndex('hubs', ['group_id', 'kode'], {
            name: 'idx_hubs_group_kode'
        });
    },

    down: async (queryInterface, Sequelize) => {
        // Hapus index
        await queryInterface.removeIndex('hubs', 'idx_hubs_group_kode');
        await queryInterface.removeIndex('hubs', 'idx_hubs_lokasi');
        await queryInterface.removeIndex('hubs', 'idx_hubs_group_id');
        await queryInterface.removeIndex('hubs', 'idx_hubs_nama');
        await queryInterface.removeIndex('hubs', 'idx_hubs_kode');

        await queryInterface.dropTable("hubs");
    },
}; 