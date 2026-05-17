'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('fleet_estimates', 'nomor_keberangkatan', {
      type: Sequelize.STRING(30),
      allowNull: true,
      comment: 'Nomor keberangkatan unik per estimasi armada (auto-generate)',
      after: 'id',
    });

    const [rows] = await queryInterface.sequelize.query(
      `SELECT id, created_at FROM fleet_estimates ORDER BY created_at ASC, id ASC`,
    );

    const seqByDate = {};
    for (const row of rows) {
      const createdAt = row.created_at ? new Date(row.created_at) : new Date();
      const yy = String(createdAt.getFullYear()).slice(-2);
      const mm = String(createdAt.getMonth() + 1).padStart(2, '0');
      const dd = String(createdAt.getDate()).padStart(2, '0');
      const dateKey = `${yy}${mm}${dd}`;
      seqByDate[dateKey] = (seqByDate[dateKey] || 0) + 1;
      const nomor = `KBR${dateKey}${String(seqByDate[dateKey]).padStart(3, '0')}`;
      await queryInterface.sequelize.query(
        `UPDATE fleet_estimates SET nomor_keberangkatan = :nomor WHERE id = :id`,
        { replacements: { nomor, id: row.id } },
      );
    }

    await queryInterface.changeColumn('fleet_estimates', 'nomor_keberangkatan', {
      type: Sequelize.STRING(30),
      allowNull: false,
      comment: 'Nomor keberangkatan unik per estimasi armada (auto-generate)',
    });

    await queryInterface.addIndex('fleet_estimates', ['nomor_keberangkatan'], {
      name: 'uq_fleet_estimates_nomor_keberangkatan',
      unique: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('fleet_estimates', 'uq_fleet_estimates_nomor_keberangkatan');
    await queryInterface.removeColumn('fleet_estimates', 'nomor_keberangkatan');
  },
};
