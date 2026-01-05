'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Model motor (e.g., "Honda Vario 160")
    await queryInterface.addColumn('orders', 'model_motor', {
      type: Sequelize.STRING(100),
      allowNull: true,
      after: 'nama_barang',
    });

    // Nomor polisi motor
    await queryInterface.addColumn('orders', 'no_polisi_motor', {
      type: Sequelize.STRING(20),
      allowNull: true,
      after: 'model_motor',
    });

    // Besaran CC (e.g., "< 150 CC", ">= 150 CC")
    await queryInterface.addColumn('orders', 'besaran_cc', {
      type: Sequelize.STRING(50),
      allowNull: true,
      after: 'no_polisi_motor',
    });

    // Motor type untuk pricing (e.g., "125cc", "150cc")
    await queryInterface.addColumn('orders', 'motor_type', {
      type: Sequelize.STRING(20),
      allowNull: true,
      after: 'besaran_cc',
    });

    // Notes khusus motor
    await queryInterface.addColumn('orders', 'motor_notes', {
      type: Sequelize.TEXT,
      allowNull: true,
      after: 'motor_type',
    });

    // Index untuk query motor orders
    await queryInterface.addIndex('orders', ['model_motor'], {
      name: 'idx_orders_model_motor',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('orders', 'idx_orders_model_motor');
    await queryInterface.removeColumn('orders', 'motor_notes');
    await queryInterface.removeColumn('orders', 'motor_type');
    await queryInterface.removeColumn('orders', 'besaran_cc');
    await queryInterface.removeColumn('orders', 'no_polisi_motor');
    await queryInterface.removeColumn('orders', 'model_motor');
  },
};


