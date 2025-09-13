'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // MySQL requires dropping foreign key to change nullability in some cases
    // Try to change column first
    try {
      await queryInterface.changeColumn('notification_badges', 'user_id', {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      });
    } catch (e) {
      // Fallback: drop FK and index, alter column, recreate FK (nullable)
      try { await queryInterface.removeConstraint('notification_badges', 'notification_badges_ibfk_1'); } catch (_) { }
      await queryInterface.changeColumn('notification_badges', 'user_id', {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      });
      await queryInterface.addConstraint('notification_badges', {
        fields: ['user_id'],
        type: 'foreign key',
        name: 'fk_notification_badges_user_id',
        references: { table: 'users', field: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.changeColumn('notification_badges', 'user_id', {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
      });
    } catch (e) {
      try { await queryInterface.removeConstraint('notification_badges', 'fk_notification_badges_user_id'); } catch (_) { }
      await queryInterface.changeColumn('notification_badges', 'user_id', {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
      });
      await queryInterface.addConstraint('notification_badges', {
        fields: ['user_id'],
        type: 'foreign key',
        name: 'notification_badges_ibfk_1',
        references: { table: 'users', field: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      });
    }
  }
};
