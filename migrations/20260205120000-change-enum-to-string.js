'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Change service_type to STRING
        await queryInterface.changeColumn('master_tarif', 'service_type', {
            type: Sequelize.STRING,
            allowNull: false,
        });

        // Change sub_service to STRING
        await queryInterface.changeColumn('master_tarif', 'sub_service', {
            type: Sequelize.STRING,
            allowNull: false,
        });
    },

    async down(queryInterface, Sequelize) {
        // Reverting back to ENUM is risky if current data violates the Enum values.
        // However, structurally, this is the previous state.
        // If strict revert is needed, we would need to clean data first or accept that this might fail.

        // Revert sub_service to ENUM
        await queryInterface.changeColumn('master_tarif', 'sub_service', {
            type: Sequelize.ENUM('HEMAT', 'REGULER', 'PAKET', 'EXPRESS'),
            allowNull: false,
        });

        // Revert service_type to ENUM
        await queryInterface.changeColumn('master_tarif', 'service_type', {
            type: Sequelize.ENUM('KIRIM_BARANG', 'KIRIM_MOTOR', 'SEWA_TRUK', 'INTERNATIONAL'),
            allowNull: false,
        });
    }
};
