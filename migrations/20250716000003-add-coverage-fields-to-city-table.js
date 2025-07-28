"use strict";

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('city', 'is_origin', {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            comment: 'Apakah kota ini bisa sebagai asal/pengirim'
        });

        await queryInterface.addColumn('city', 'is_destination', {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            comment: 'Apakah kota ini bisa sebagai tujuan/penerima'
        });

        await queryInterface.addColumn('city', 'coverage_status', {
            type: Sequelize.ENUM('active', 'inactive', 'limited'),
            allowNull: false,
            defaultValue: 'active',
            comment: 'Status coverage: active=full coverage, inactive=no coverage, limited=partial coverage'
        });

        await queryInterface.addColumn('city', 'coverage_notes', {
            type: Sequelize.TEXT,
            allowNull: true,
            comment: 'Catatan tambahan untuk coverage area'
        });

        // Tambahkan index untuk optimasi query coverage
        await queryInterface.addIndex('city', ['is_origin'], {
            name: 'idx_city_is_origin'
        });

        await queryInterface.addIndex('city', ['is_destination'], {
            name: 'idx_city_is_destination'
        });

        await queryInterface.addIndex('city', ['coverage_status'], {
            name: 'idx_city_coverage_status'
        });

        // Composite index untuk pencarian coverage
        await queryInterface.addIndex('city', ['is_origin', 'is_destination'], {
            name: 'idx_city_coverage_type'
        });

        await queryInterface.addIndex('city', ['coverage_status', 'provinsi'], {
            name: 'idx_city_coverage_status_provinsi'
        });
    },

    down: async (queryInterface, Sequelize) => {
        // Hapus index
        await queryInterface.removeIndex('city', 'idx_city_coverage_status_provinsi');
        await queryInterface.removeIndex('city', 'idx_city_coverage_type');
        await queryInterface.removeIndex('city', 'idx_city_coverage_status');
        await queryInterface.removeIndex('city', 'idx_city_is_destination');
        await queryInterface.removeIndex('city', 'idx_city_is_origin');

        // Hapus kolom
        await queryInterface.removeColumn('city', 'coverage_notes');
        await queryInterface.removeColumn('city', 'coverage_status');
        await queryInterface.removeColumn('city', 'is_destination');
        await queryInterface.removeColumn('city', 'is_origin');
    },
}; 