'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Ubah photo dan signature di order_pickup_drivers menjadi TEXT
        await queryInterface.changeColumn('order_pickup_drivers', 'photo', {
            type: Sequelize.TEXT,
            allowNull: false,
        });

        await queryInterface.changeColumn('order_pickup_drivers', 'signature', {
            type: Sequelize.TEXT,
            allowNull: false,
        });

        // Ubah photo dan signature di order_deliver_drivers menjadi TEXT
        await queryInterface.changeColumn('order_deliver_drivers', 'photo', {
            type: Sequelize.TEXT,
            allowNull: false,
        });

        await queryInterface.changeColumn('order_deliver_drivers', 'signature', {
            type: Sequelize.TEXT,
            allowNull: false,
        });
    },

    async down(queryInterface, Sequelize) {
        // Rollback: ubah kembali menjadi VARCHAR jika diperlukan
        // Note: Karena sebelumnya sudah TEXT, kita akan tetap TEXT saat rollback
        // Jika ingin rollback ke VARCHAR, sesuaikan dengan kebutuhan
        await queryInterface.changeColumn('order_pickup_drivers', 'photo', {
            type: Sequelize.TEXT,
            allowNull: false,
        });

        await queryInterface.changeColumn('order_pickup_drivers', 'signature', {
            type: Sequelize.TEXT,
            allowNull: false,
        });

        await queryInterface.changeColumn('order_deliver_drivers', 'photo', {
            type: Sequelize.TEXT,
            allowNull: false,
        });

        await queryInterface.changeColumn('order_deliver_drivers', 'signature', {
            type: Sequelize.TEXT,
            allowNull: false,
        });
    }
};

