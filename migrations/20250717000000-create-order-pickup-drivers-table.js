module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('order_pickup_drivers', {
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
            driver_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            assign_date: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            name: {
                type: Sequelize.STRING(200),
                allowNull: false,
            },
            photo: {
                type: Sequelize.TEXT,
                allowNull: false,
            },
            notes: {
                type: Sequelize.TEXT,
                allowNull: false,
            },
            signature: {
                type: Sequelize.TEXT,
                allowNull: false,
            },
            status: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            svc_id: {
                type: Sequelize.STRING(100),
                allowNull: true,
                defaultValue: null,
            },
            latlng: {
                type: Sequelize.TEXT,
                allowNull: true,
                defaultValue: null,
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: true,
                defaultValue: null,
            },
        });
    },
    down: async (queryInterface) => {
        await queryInterface.dropTable('order_pickup_drivers');
    },
}; 