'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('users', 'url_foto_ktp', {
            type: Sequelize.TEXT,
            allowNull: true,
        });
        await queryInterface.addColumn('users', 'url_foto_sim', {
            type: Sequelize.TEXT,
            allowNull: true,
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('users', 'url_foto_ktp');
        await queryInterface.removeColumn('users', 'url_foto_sim');
    }
};
