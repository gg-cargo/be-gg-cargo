'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('notification_badges', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      user_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      menu_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      item_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      item_type: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      hub_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      is_read: {
        type: Sequelize.TINYINT,
        allowNull: false,
        defaultValue: 0
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for performance
    await queryInterface.addIndex('notification_badges', ['user_id']);
    await queryInterface.addIndex('notification_badges', ['hub_id']);
    await queryInterface.addIndex('notification_badges', ['menu_name']);
    await queryInterface.addIndex('notification_badges', ['item_id', 'item_type']);
    await queryInterface.addIndex('notification_badges', ['is_read']);
    await queryInterface.addIndex('notification_badges', ['created_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('notification_badges');
  }
};