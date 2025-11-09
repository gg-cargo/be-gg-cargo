'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('orders', 'status_deliver', {
            type: Sequelize.STRING(20),
            allowNull: true,
            comment: 'Status delivery order (Completed, Failed, Pending, In Transit, dll)',
            after: 'status_pickup',
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('orders', 'status_deliver');
    },
};

