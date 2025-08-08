'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('users_bank', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER(11)
            },
            id_user: {
                type: Sequelize.STRING(50),
                allowNull: false
            },
            code_bank: {
                type: Sequelize.STRING(50),
                allowNull: true,
                defaultValue: null
            },
            nama_bank: {
                type: Sequelize.STRING(50),
                allowNull: false
            },
            nama_pemilik_rekening: {
                type: Sequelize.STRING(200),
                allowNull: false
            },
            nomor_rekening: {
                type: Sequelize.STRING(50),
                allowNull: false
            },
            image: {
                type: Sequelize.TEXT('long'),
                allowNull: true,
                defaultValue: null
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('users_bank');
    }
}; 