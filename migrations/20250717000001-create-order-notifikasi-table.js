module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('order_notifikasi', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false,
            },
            message: {
                type: Sequelize.STRING(250),
                allowNull: true,
                defaultValue: null,
            },
            order_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            svc_source: {
                type: Sequelize.INTEGER,
                allowNull: true,
                defaultValue: null,
            },
            hub_source: {
                type: Sequelize.INTEGER,
                allowNull: true,
                defaultValue: null,
            },
            svc_dest: {
                type: Sequelize.INTEGER,
                allowNull: true,
                defaultValue: null,
            },
            hub_dest: {
                type: Sequelize.INTEGER,
                allowNull: true,
                defaultValue: null,
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            status: {
                type: Sequelize.INTEGER,
                allowNull: true,
                defaultValue: 1,
            },
            reweight: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            pembayaran: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            voucher: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            saldo: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            pengiriman: {
                type: Sequelize.STRING(25),
                allowNull: false,
                defaultValue: '0',
            },
            news: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            user_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
        });
    },
    down: async (queryInterface) => {
        await queryInterface.dropTable('order_notifikasi');
    },
}; 