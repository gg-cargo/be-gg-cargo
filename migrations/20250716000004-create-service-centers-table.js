"use strict";

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable("service_centers", {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false,
            },
            hub_id: {
                type: Sequelize.INTEGER,
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
            agent_id: {
                type: Sequelize.STRING(50),
                allowNull: true,
                defaultValue: null,
            },
            latlng: {
                type: Sequelize.TEXT,
                allowNull: false,
                defaultValue: '0,0',
            },
            zone: {
                type: Sequelize.STRING(100),
                allowNull: true,
                defaultValue: null,
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
        });

        // Tambahkan index untuk optimasi query
        await queryInterface.addIndex('service_centers', ['hub_id'], {
            name: 'idx_service_centers_hub_id'
        });

        await queryInterface.addIndex('service_centers', ['kode'], {
            name: 'idx_service_centers_kode'
        });

        await queryInterface.addIndex('service_centers', ['nama'], {
            name: 'idx_service_centers_nama'
        });

        await queryInterface.addIndex('service_centers', ['zone'], {
            name: 'idx_service_centers_zone'
        });

        await queryInterface.addIndex('service_centers', ['agent_id'], {
            name: 'idx_service_centers_agent_id'
        });

        // Composite index untuk pencarian berdasarkan hub dan zone
        await queryInterface.addIndex('service_centers', ['hub_id', 'zone'], {
            name: 'idx_service_centers_hub_zone'
        });
    },

    down: async (queryInterface, Sequelize) => {
        // Hapus index
        await queryInterface.removeIndex('service_centers', 'idx_service_centers_hub_zone');
        await queryInterface.removeIndex('service_centers', 'idx_service_centers_agent_id');
        await queryInterface.removeIndex('service_centers', 'idx_service_centers_zone');
        await queryInterface.removeIndex('service_centers', 'idx_service_centers_nama');
        await queryInterface.removeIndex('service_centers', 'idx_service_centers_kode');
        await queryInterface.removeIndex('service_centers', 'idx_service_centers_hub_id');

        await queryInterface.dropTable("service_centers");
    },
}; 