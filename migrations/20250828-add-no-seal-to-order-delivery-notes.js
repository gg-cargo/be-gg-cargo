"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn("order_delivery_notes", "no_seal", {
            type: Sequelize.STRING(150),
            allowNull: true,
            comment: "Nomor seal, maksimal 3, disimpan dipisah koma",
            after: "no_polisi",
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn("order_delivery_notes", "no_seal");
    },
};


