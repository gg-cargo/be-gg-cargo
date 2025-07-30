"use strict";

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable("order_list", {
            id: {
                type: Sequelize.BIGINT,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false,
            },
            no_tracking: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            nama_pengirim: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            alamat_pengirim: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            provinsi_pengirim: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            kota_pengirim: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            kecamatan_pengirim: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            kelurahan_pengirim: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            kodepos_pengirim: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            no_telepon_pengirim: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            email_pengirim: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            nama_penerima: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            alamat_penerima: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            provinsi_penerima: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            kota_penerima: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            kecamatan_penerima: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            kelurahan_penerima: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            kodepos_penerima: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            no_telepon_penerima: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            email_penerima: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            status_pickup: {
                type: Sequelize.STRING(20),
                allowNull: true,
            },
            nama_barang: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            harga_barang: {
                type: Sequelize.DOUBLE,
                allowNull: true,
            },
            asuransi: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            pickup_time: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            total_berat: {
                type: Sequelize.STRING(50),
                allowNull: true,
            },
            total_harga: {
                type: Sequelize.DOUBLE,
                allowNull: true,
            },
            status: {
                type: Sequelize.STRING(200),
                allowNull: true,
            },
            payment_uuid: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            payment_type: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            payment_transaction_time: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            payment_expire_time: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            payment_redirect: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            payment_status: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            reweight_status: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            pickup_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            is_gagal_pickup: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            order_by: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            actual_weight: {
                type: Sequelize.DOUBLE,
                allowNull: true,
            },
            volume_weight: {
                type: Sequelize.DOUBLE,
                allowNull: true,
            },
            pickup_scan: {
                type: Sequelize.DECIMAL(22, 0),
                allowNull: true,
            },
            deliver_scan: {
                type: Sequelize.DECIMAL(22, 0),
                allowNull: true,
            },
            outbound_scan: {
                type: Sequelize.DECIMAL(22, 0),
                allowNull: true,
            },
            inbound_scan: {
                type: Sequelize.DECIMAL(22, 0),
                allowNull: true,
            },
            hub_scan: {
                type: Sequelize.DECIMAL(22, 0),
                allowNull: true,
            },
            reweight_scan: {
                type: Sequelize.DECIMAL(22, 0),
                allowNull: true,
            },
            total_price: {
                type: Sequelize.DOUBLE,
                allowNull: true,
            },
            jumlah_koli: {
                type: Sequelize.DECIMAL(65, 0),
                allowNull: true,
            },
            order_name: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            kolom_pengirim: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            kolom_penerima: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            svc_source_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            hub_source_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            svc_dest_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            hub_dest_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            fm: {
                type: Sequelize.DOUBLE,
                allowNull: true,
            },
            lm: {
                type: Sequelize.DOUBLE,
                allowNull: true,
            },
        });

        // Tambahkan index untuk optimasi query
        await queryInterface.addIndex('order_list', ['no_tracking'], {
            name: 'idx_order_list_no_tracking'
        });

        await queryInterface.addIndex('order_list', ['status'], {
            name: 'idx_order_list_status'
        });

        await queryInterface.addIndex('order_list', ['payment_status'], {
            name: 'idx_order_list_payment_status'
        });

        await queryInterface.addIndex('order_list', ['order_by'], {
            name: 'idx_order_list_order_by'
        });

        await queryInterface.addIndex('order_list', ['created_at'], {
            name: 'idx_order_list_created_at'
        });

        await queryInterface.addIndex('order_list', ['pickup_id'], {
            name: 'idx_order_list_pickup_id'
        });

        await queryInterface.addIndex('order_list', ['svc_source_id'], {
            name: 'idx_order_list_svc_source_id'
        });

        await queryInterface.addIndex('order_list', ['hub_source_id'], {
            name: 'idx_order_list_hub_source_id'
        });

        await queryInterface.addIndex('order_list', ['svc_dest_id'], {
            name: 'idx_order_list_svc_dest_id'
        });

        await queryInterface.addIndex('order_list', ['hub_dest_id'], {
            name: 'idx_order_list_hub_dest_id'
        });

        // Composite index untuk pencarian berdasarkan status dan tanggal
        await queryInterface.addIndex('order_list', ['status', 'created_at'], {
            name: 'idx_order_list_status_created_at'
        });

        // Composite index untuk pencarian berdasarkan payment status dan tanggal
        await queryInterface.addIndex('order_list', ['payment_status', 'created_at'], {
            name: 'idx_order_list_payment_status_created_at'
        });
    },

    down: async (queryInterface, Sequelize) => {
        // Hapus index
        await queryInterface.removeIndex('order_list', 'idx_order_list_payment_status_created_at');
        await queryInterface.removeIndex('order_list', 'idx_order_list_status_created_at');
        await queryInterface.removeIndex('order_list', 'idx_order_list_hub_dest_id');
        await queryInterface.removeIndex('order_list', 'idx_order_list_svc_dest_id');
        await queryInterface.removeIndex('order_list', 'idx_order_list_hub_source_id');
        await queryInterface.removeIndex('order_list', 'idx_order_list_svc_source_id');
        await queryInterface.removeIndex('order_list', 'idx_order_list_pickup_id');
        await queryInterface.removeIndex('order_list', 'idx_order_list_created_at');
        await queryInterface.removeIndex('order_list', 'idx_order_list_order_by');
        await queryInterface.removeIndex('order_list', 'idx_order_list_payment_status');
        await queryInterface.removeIndex('order_list', 'idx_order_list_status');
        await queryInterface.removeIndex('order_list', 'idx_order_list_no_tracking');

        await queryInterface.dropTable("order_list");
    },
}; 