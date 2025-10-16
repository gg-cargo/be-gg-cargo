'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('job_assigns', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            number: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            checker_name: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            checker_by: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            expeditor_name: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            expeditor_by: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            no_polisi: {
                type: Sequelize.STRING(200),
                allowNull: true,
            },
            distance: {
                type: Sequelize.TEXT,
                allowNull: false,
                defaultValue: '0',
            },
            status: {
                type: Sequelize.INTEGER,
                allowNull: true,
                defaultValue: 0,
                comment: '0: Process | 1: Completed | 2: Confirm',
            },
            remark: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            waypoints: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            konfirmasi_at: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            completed_at: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            completed_day: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
        });

        // Pastikan kolom no_polisi dapat diindeks (ubah jika tabel sudah terlanjur dibuat)
        await queryInterface.changeColumn('job_assigns', 'no_polisi', {
            type: Sequelize.STRING(200),
            allowNull: true,
        });

        await queryInterface.addIndex('job_assigns', ['no_polisi']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('job_assigns');
    },
};
