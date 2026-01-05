'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add referred_by_sales_id column
    await queryInterface.addColumn('users', 'referred_by_sales_id', {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: true,
      after: 'level',
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    // Add sales_referral_code column
    await queryInterface.addColumn('users', 'sales_referral_code', {
      type: Sequelize.STRING(25),
      allowNull: true,
      after: 'referred_by_sales_id',
    });

    // Add sales_linked_at column
    await queryInterface.addColumn('users', 'sales_linked_at', {
      type: Sequelize.DATE,
      allowNull: true,
      after: 'sales_referral_code',
    });

    // Add index for better query performance
    await queryInterface.addIndex('users', ['referred_by_sales_id'], {
      name: 'idx_users_referred_by_sales',
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove index
    await queryInterface.removeIndex('users', 'idx_users_referred_by_sales');
    
    // Remove columns
    await queryInterface.removeColumn('users', 'sales_linked_at');
    await queryInterface.removeColumn('users', 'sales_referral_code');
    await queryInterface.removeColumn('users', 'referred_by_sales_id');
  },
};

