'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('bank_list', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER(11)
            },
            code: {
                type: Sequelize.STRING(50),
                allowNull: true,
                defaultValue: null
            },
            nama: {
                type: Sequelize.STRING(50),
                allowNull: true,
                defaultValue: null
            },
            image: {
                type: Sequelize.TEXT('long'),
                allowNull: true,
                defaultValue: null
            }
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('bank_list');
    }
}; 