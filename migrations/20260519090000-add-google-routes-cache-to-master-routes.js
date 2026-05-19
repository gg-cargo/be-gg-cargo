'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('master_routes', 'distance_km_toll', {
      type: Sequelize.DOUBLE,
      allowNull: true,
      defaultValue: null,
      comment: 'Jarak via tol dari Google Routes API (km)',
      after: 'default_distance_km',
    });

    await queryInterface.addColumn('master_routes', 'distance_km_non_toll', {
      type: Sequelize.DOUBLE,
      allowNull: true,
      defaultValue: null,
      comment: 'Jarak non-tol dari Google Routes API (km)',
      after: 'distance_km_toll',
    });

    await queryInterface.addColumn('master_routes', 'duration_min_toll', {
      type: Sequelize.DOUBLE,
      allowNull: true,
      defaultValue: null,
      comment: 'Durasi via tol dari Google Routes API (menit)',
      after: 'distance_km_non_toll',
    });

    await queryInterface.addColumn('master_routes', 'duration_min_non_toll', {
      type: Sequelize.DOUBLE,
      allowNull: true,
      defaultValue: null,
      comment: 'Durasi non-tol dari Google Routes API (menit)',
      after: 'duration_min_toll',
    });

    await queryInterface.addColumn('master_routes', 'toll_cost_estimate_idr', {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: true,
      defaultValue: null,
      comment: 'Estimasi biaya tol dari Google Routes API (IDR)',
      after: 'duration_min_non_toll',
    });

    await queryInterface.addColumn('master_routes', 'google_routes_source', {
      type: Sequelize.ENUM('google', 'mapbox', 'fallback', 'manual'),
      allowNull: false,
      defaultValue: 'fallback',
      comment: 'Sumber data jarak: google/mapbox/fallback/manual',
      after: 'toll_cost_estimate_idr',
    });

    await queryInterface.addColumn('master_routes', 'google_routes_refreshed_at', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
      comment: 'Waktu terakhir data jarak diperbarui dari Google Routes API',
      after: 'google_routes_source',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('master_routes', 'google_routes_refreshed_at');
    await queryInterface.removeColumn('master_routes', 'google_routes_source');
    await queryInterface.removeColumn('master_routes', 'toll_cost_estimate_idr');
    await queryInterface.removeColumn('master_routes', 'duration_min_non_toll');
    await queryInterface.removeColumn('master_routes', 'duration_min_toll');
    await queryInterface.removeColumn('master_routes', 'distance_km_non_toll');
    await queryInterface.removeColumn('master_routes', 'distance_km_toll');
  },
};
