'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('quotation', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER(11)
            },
            no_quotation: {
                type: Sequelize.STRING(100),
                allowNull: true,
                defaultValue: null
            },
            request_by: {
                type: Sequelize.STRING(100),
                allowNull: true,
                defaultValue: null
            },
            preuser_by: {
                type: Sequelize.STRING(100),
                allowNull: true,
                defaultValue: null
            },
            customer_by: {
                type: Sequelize.STRING(100),
                allowNull: true,
                defaultValue: null
            },
            body: {
                type: Sequelize.TEXT('long'),
                allowNull: true,
                defaultValue: null
            },
            hitung_by: {
                type: Sequelize.INTEGER(11),
                allowNull: false,
                defaultValue: 0,
                comment: '0: Kg | 1: Pcs | 2: Kubikasi'
            },
            layanan: {
                type: Sequelize.STRING(100),
                allowNull: true,
                defaultValue: null
            },
            valid_day: {
                type: Sequelize.STRING(100),
                allowNull: true,
                defaultValue: null
            },
            status: {
                type: Sequelize.INTEGER(11),
                allowNull: false,
                defaultValue: 0,
                comment: '0: Pending | 1: Success'
            },
            is_rejected: {
                type: Sequelize.INTEGER(11),
                allowNull: false,
                defaultValue: 0,
                comment: '0: No | 1: Yes'
            },
            reason_rejected: {
                type: Sequelize.TEXT,
                allowNull: true,
                defaultValue: null
            },
            as_kontrak_id: {
                type: Sequelize.STRING(100),
                allowNull: true,
                defaultValue: null
            },
            pic_name: {
                type: Sequelize.STRING(100),
                allowNull: true,
                defaultValue: null
            },
            address: {
                type: Sequelize.TEXT('long'),
                allowNull: true,
                defaultValue: null
            },
            user_name: {
                type: Sequelize.STRING(100),
                allowNull: true,
                defaultValue: null
            },
            terms: {
                type: Sequelize.INTEGER(11),
                allowNull: false,
                defaultValue: 0
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('quotation');
    }
}; 