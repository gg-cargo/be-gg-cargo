'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Cek apakah ada duplikat sebelum menambahkan constraint
        const [duplicates] = await queryInterface.sequelize.query(`
      SELECT no_tracking, COUNT(*) as count
      FROM orders
      GROUP BY no_tracking
      HAVING count > 1
    `);

        if (duplicates.length > 0) {
            console.log('WARNING: Found duplicate tracking numbers:', duplicates);
            console.log('Please clean up duplicates before running this migration.');
            // Uncomment line below if you want to prevent migration when duplicates exist
            // throw new Error('Duplicate tracking numbers found. Please clean up first.');
        }

        // Tambahkan unique index ke kolom no_tracking
        await queryInterface.addIndex('orders', ['no_tracking'], {
            unique: true,
            name: 'unique_no_tracking'
        });
    },

    async down(queryInterface, Sequelize) {
        // Hapus unique index
        await queryInterface.removeIndex('orders', 'unique_no_tracking');
    }
};
