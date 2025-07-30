module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('request_cancel', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false,
            },
            order_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            user_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            reason: {
                type: Sequelize.TEXT,
                allowNull: true,
                defaultValue: 'Tidak jadi memesan',
            },
            status: {
                type: Sequelize.INTEGER,
                allowNull: true,
                defaultValue: 0,
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
        });
    },
    down: async (queryInterface) => {
        await queryInterface.dropTable('request_cancel');
    },
}; 