'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const tableName = 'reweight_correction_requests';

        const foreignKeys = await queryInterface.getForeignKeyReferencesForTable(tableName);
        const pieceIdFks = (foreignKeys || []).filter((fk) => fk.columnName === 'piece_id' && fk.constraintName);

        for (const fk of pieceIdFks) {
            await queryInterface.removeConstraint(tableName, fk.constraintName);
        }

        await queryInterface.changeColumn(tableName, 'piece_id', {
            type: Sequelize.INTEGER(11),
            allowNull: true,
        });

        await queryInterface.addConstraint(tableName, {
            fields: ['piece_id'],
            type: 'foreign key',
            name: 'fk_reweight_correction_requests_piece_id',
            references: {
                table: 'order_pieces',
                field: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        });
    },

    async down(queryInterface, Sequelize) {
        const tableName = 'reweight_correction_requests';

        await queryInterface.removeConstraint(tableName, 'fk_reweight_correction_requests_piece_id');

        await queryInterface.changeColumn(tableName, 'piece_id', {
            type: Sequelize.INTEGER(11),
            allowNull: false,
        });

        await queryInterface.addConstraint(tableName, {
            fields: ['piece_id'],
            type: 'foreign key',
            name: 'fk_reweight_correction_requests_piece_id',
            references: {
                table: 'order_pieces',
                field: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        });
    }
};
