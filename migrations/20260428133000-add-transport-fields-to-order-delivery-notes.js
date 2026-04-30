"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn("order_delivery_notes", "transport_mode", {
            type: Sequelize.ENUM("darat", "laut", "udara"),
            allowNull: false,
            defaultValue: "darat",
            after: "transporter_id",
        });

        await queryInterface.addColumn("order_delivery_notes", "awb_number", {
            type: Sequelize.STRING(100),
            allowNull: true,
            after: "no_seal",
        });

        await queryInterface.addColumn("order_delivery_notes", "aircraft_name", {
            type: Sequelize.STRING(200),
            allowNull: true,
            after: "awb_number",
        });

        await queryInterface.addColumn("order_delivery_notes", "bl_number", {
            type: Sequelize.STRING(100),
            allowNull: true,
            after: "aircraft_name",
        });

        await queryInterface.addColumn("order_delivery_notes", "vessel_name", {
            type: Sequelize.STRING(200),
            allowNull: true,
            after: "bl_number",
        });

        await queryInterface.addColumn("order_delivery_notes", "etd", {
            type: Sequelize.DATE,
            allowNull: true,
            after: "vessel_name",
        });

        await queryInterface.addColumn("order_delivery_notes", "eta", {
            type: Sequelize.DATE,
            allowNull: true,
            after: "etd",
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn("order_delivery_notes", "eta");
        await queryInterface.removeColumn("order_delivery_notes", "etd");
        await queryInterface.removeColumn("order_delivery_notes", "vessel_name");
        await queryInterface.removeColumn("order_delivery_notes", "bl_number");
        await queryInterface.removeColumn("order_delivery_notes", "aircraft_name");
        await queryInterface.removeColumn("order_delivery_notes", "awb_number");
        await queryInterface.removeColumn("order_delivery_notes", "transport_mode");

        if (queryInterface.sequelize.getDialect() === "postgres") {
            await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_order_delivery_notes_transport_mode";');
        }
    },
};
