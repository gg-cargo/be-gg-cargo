'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('truck_list', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            no_polisi: {
                type: Sequelize.STRING(200),
                allowNull: true
            },
            jenis_mobil: {
                type: Sequelize.STRING(200),
                allowNull: true
            },
            max_berat: {
                type: Sequelize.STRING(50),
                allowNull: true
            },
            max_volume: {
                type: Sequelize.STRING(50),
                allowNull: true
            },
            max_kubikasi: {
                type: Sequelize.STRING(50),
                allowNull: true
            },
            panjang: {
                type: Sequelize.STRING(50),
                allowNull: true
            },
            lebar: {
                type: Sequelize.STRING(50),
                allowNull: true
            },
            tinggi: {
                type: Sequelize.STRING(50),
                allowNull: true
            },
            status: {
                type: Sequelize.INTEGER,
                allowNull: true,
                comment: '1:sedang digunakan, 0:tidak digunakan'
            },
            driver_id: {
                type: Sequelize.INTEGER,
                allowNull: true
            },
            used: {
                type: Sequelize.INTEGER,
                allowNull: true
            },
            image: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            price: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0
            },
            priceLower: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            tol: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0
            },
            handling: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0
            },
            solar: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0
            },
            ferrie: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0
            },
            speed: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0
            },
            type: {
                type: Sequelize.STRING(200),
                allowNull: false,
                defaultValue: '3AxlesTruck'
            },
            harga_solar: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0
            },
            konsumsi_solar: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0
            }
        });

        // Add indexes
        try {
            await queryInterface.addIndex('truck_list', ['no_polisi'], {
                name: 'truck_list_no_polisi'
            });
        } catch (error) {
            // Index already exists, skip
        }

        try {
            await queryInterface.addIndex('truck_list', ['driver_id'], {
                name: 'truck_list_driver_id'
            });
        } catch (error) {
            // Index already exists, skip
        }

        try {
            await queryInterface.addIndex('truck_list', ['status'], {
                name: 'truck_list_status'
            });
        } catch (error) {
            // Index already exists, skip
        }

        try {
            await queryInterface.addIndex('truck_list', ['type'], {
                name: 'truck_list_type'
            });
        } catch (error) {
            // Index already exists, skip
        }
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('truck_list');
    }
};
