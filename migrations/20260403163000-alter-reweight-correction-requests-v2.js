'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('reweight_correction_requests', 'batch_id', {
            type: Sequelize.BIGINT(20),
            allowNull: true,
            comment: 'ID batch pengajuan koreksi reweight'
        });

        await queryInterface.addColumn('reweight_correction_requests', 'action_type', {
            type: Sequelize.STRING(10),
            allowNull: false,
            defaultValue: 'UPDATE',
            comment: 'ADD | UPDATE | REMOVE'
        });

        await queryInterface.changeColumn('reweight_correction_requests', 'piece_id', {
            type: Sequelize.INTEGER(11),
            allowNull: true,
            references: {
                model: 'order_pieces',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        });

        await queryInterface.changeColumn('reweight_correction_requests', 'current_berat', {
            type: Sequelize.DOUBLE,
            allowNull: true,
            comment: 'Berat saat ini sebelum koreksi'
        });

        await queryInterface.changeColumn('reweight_correction_requests', 'current_panjang', {
            type: Sequelize.DOUBLE,
            allowNull: true,
            comment: 'Panjang saat ini sebelum koreksi'
        });

        await queryInterface.changeColumn('reweight_correction_requests', 'current_lebar', {
            type: Sequelize.DOUBLE,
            allowNull: true,
            comment: 'Lebar saat ini sebelum koreksi'
        });

        await queryInterface.changeColumn('reweight_correction_requests', 'current_tinggi', {
            type: Sequelize.DOUBLE,
            allowNull: true,
            comment: 'Tinggi saat ini sebelum koreksi'
        });

        await queryInterface.changeColumn('reweight_correction_requests', 'new_berat', {
            type: Sequelize.DOUBLE,
            allowNull: true,
            comment: 'Berat baru yang diminta'
        });

        await queryInterface.changeColumn('reweight_correction_requests', 'new_panjang', {
            type: Sequelize.DOUBLE,
            allowNull: true,
            comment: 'Panjang baru yang diminta'
        });

        await queryInterface.changeColumn('reweight_correction_requests', 'new_lebar', {
            type: Sequelize.DOUBLE,
            allowNull: true,
            comment: 'Lebar baru yang diminta'
        });

        await queryInterface.changeColumn('reweight_correction_requests', 'new_tinggi', {
            type: Sequelize.DOUBLE,
            allowNull: true,
            comment: 'Tinggi baru yang diminta'
        });

        await queryInterface.addIndex('reweight_correction_requests', ['batch_id']);
        await queryInterface.addIndex('reweight_correction_requests', ['order_id', 'status', 'batch_id']);
        await queryInterface.addIndex('reweight_correction_requests', ['action_type']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeIndex('reweight_correction_requests', ['action_type']);
        await queryInterface.removeIndex('reweight_correction_requests', ['order_id', 'status', 'batch_id']);
        await queryInterface.removeIndex('reweight_correction_requests', ['batch_id']);

        await queryInterface.removeColumn('reweight_correction_requests', 'action_type');
        await queryInterface.removeColumn('reweight_correction_requests', 'batch_id');

        await queryInterface.changeColumn('reweight_correction_requests', 'piece_id', {
            type: Sequelize.INTEGER(11),
            allowNull: false,
            references: {
                model: 'order_pieces',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        });

        await queryInterface.changeColumn('reweight_correction_requests', 'current_berat', {
            type: Sequelize.DOUBLE,
            allowNull: false,
            comment: 'Berat saat ini sebelum koreksi'
        });

        await queryInterface.changeColumn('reweight_correction_requests', 'current_panjang', {
            type: Sequelize.DOUBLE,
            allowNull: false,
            comment: 'Panjang saat ini sebelum koreksi'
        });

        await queryInterface.changeColumn('reweight_correction_requests', 'current_lebar', {
            type: Sequelize.DOUBLE,
            allowNull: false,
            comment: 'Lebar saat ini sebelum koreksi'
        });

        await queryInterface.changeColumn('reweight_correction_requests', 'current_tinggi', {
            type: Sequelize.DOUBLE,
            allowNull: false,
            comment: 'Tinggi saat ini sebelum koreksi'
        });

        await queryInterface.changeColumn('reweight_correction_requests', 'new_berat', {
            type: Sequelize.DOUBLE,
            allowNull: false,
            comment: 'Berat baru yang diminta'
        });

        await queryInterface.changeColumn('reweight_correction_requests', 'new_panjang', {
            type: Sequelize.DOUBLE,
            allowNull: false,
            comment: 'Panjang baru yang diminta'
        });

        await queryInterface.changeColumn('reweight_correction_requests', 'new_lebar', {
            type: Sequelize.DOUBLE,
            allowNull: false,
            comment: 'Lebar baru yang diminta'
        });

        await queryInterface.changeColumn('reweight_correction_requests', 'new_tinggi', {
            type: Sequelize.DOUBLE,
            allowNull: false,
            comment: 'Tinggi baru yang diminta'
        });
    }
};
