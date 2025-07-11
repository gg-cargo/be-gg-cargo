'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('orders', {
      id: {
        type: Sequelize.BIGINT(20),
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      no_tracking: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      nama_pengirim: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      alamat_pengirim: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      provinsi_pengirim: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      kota_pengirim: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      kecamatan_pengirim: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      kelurahan_pengirim: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      kodepos_pengirim: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      no_telepon_pengirim: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      email_pengirim: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      nama_penerima: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      alamat_penerima: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      provinsi_penerima: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      kota_penerima: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      kecamatan_penerima: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      kelurahan_penerima: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      kodepos_penerima: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      no_telepon_penerima: {
        type: Sequelize.STRING(255),
        allowNull: false,
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
        allowNull: false,
      },
      asuransi: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      packing: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
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
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      voucher: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      layanan: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'Reguler',
      },
      id_kontrak: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      dokumen_po: {
        type: Sequelize.STRING(250),
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
        allowNull: false,
        defaultValue: 0,
      },
      pickup_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      assign_driver: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      assign_svc: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      is_gagal_pickup: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      bypass_payment_check: {
        type: Sequelize.STRING(10),
        allowNull: true,
      },
      bypass_reweight: {
        type: Sequelize.STRING(11),
        allowNull: true,
      },
      min_transit_time: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      max_transit_time: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      svc_source_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      hub_source_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      svc_dest_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      hub_dest_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      order_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      promotor_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      pickup_by: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      deliver_by: {
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: '0',
      },
      latlngAsal: {
        type: Sequelize.STRING(250),
        allowNull: true,
      },
      latlngTujuan: {
        type: Sequelize.STRING(250),
        allowNull: true,
      },
      ferrie_id: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      truck_id: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      truck_xpdc_id: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      transporter_id: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      transporter_konfirmasi: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      driver2_id: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      port_source: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      port_destination: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      port_vendor: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      orderTime: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      orderEstimate: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      surat_jalan_balik: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      distance: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      current_hub: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      next_hub: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      remark_finance: {
        type: Sequelize.TEXT('long'),
        allowNull: true,
      },
      remark_reweight: {
        type: Sequelize.TEXT('long'),
        allowNull: true,
      },
      remark_traffic: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      remark_sales: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      remark_sales_supabase: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '0: Belum | 1: Sudah',
      },
      sewaTruckKoli: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      sewaTruckBerat: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      sewaTruckKubikasi: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      sewaTruckURLSJ: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      sewaTruckRAWSJ: {
        type: Sequelize.TEXT('long'),
        allowNull: true,
      },
      payment_100: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      payment_70: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      payment_30: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      cost_100: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      cost_90: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      cost_70: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      cost_30: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      cost_10: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      id_kontrak_cost: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      metode_bayar_truck: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: '1:Pembayaran 70% 30% | 2: Full Payment/100%',
      },
      total_transit: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      jarak_transit: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      target_tempuh: {
        type: Sequelize.STRING(150),
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
      isSuratJalanBalik: {
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: '0',
        comment: '0: Tidak ada | 1: Ada',
      },
      no_referensi: {
        type: Sequelize.TEXT('long'),
        allowNull: true,
      },
      SJName: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      SJPhone: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      SJAddress: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      SJLocation: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      SJLatlng: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      SJReturn: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '0 : Belum Dikirim | 1 : Sudah Dikirim',
      },
      SJImagePickup: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      SJImageDeliver: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      date_start: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Selesai Muat',
      },
      date_target: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      date_end: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Sampai lokasi bongkar',
      },
      total_jam: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      is_rating: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'No',
        comment: 'No | Yes',
      },
      id_rating: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      override_cost_90: {
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: '0',
        comment: '0: Tidak | 1: Ya',
      },
      override_cost_70: {
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: '0',
        comment: '0: Tidak | 1: Ya',
      },
      override_cost_30: {
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: '0',
        comment: '0: Tidak | 1: Ya',
      },
      override_cost_10: {
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: '0',
        comment: '0: Tidak | 1: Ya',
      },
      ops_update_target: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      ops_update: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      id_channel: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      isKios: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '0: Bukan | 1: Iya',
      },
      codeKios: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      isBypass: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      isBypassBefore: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      issetManifest: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '0:Belum|1:udah',
      },
      issetManifest_inbound: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '0: Belum | 1: Sudah',
      },
      manifest_in_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Sudah di hub out dari HUB Tujuan',
      },
      typeCustomer: {
        type: Sequelize.STRING(200),
        allowNull: true,
        comment: 'Account | Non Account',
      },
      isProblem: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '0: No | 1: Yes',
      },
      isDropoff: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '0: Tidak | 1: Ya',
      },
      isUseToll: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '0: Tidak | 1: Iya',
      },
      invoiceStatus: {
        type: Sequelize.STRING(200),
        allowNull: false,
        defaultValue: 'draft',
        comment: 'success | draft',
      },
      isUnpaid: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '0: Tidak | 1: Iya',
      },
      no_soa: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      date_submit: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      assign_sj: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'jika ada maka status clear',
      },
      kledo_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      isPartialPaid: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '0: Tidak | 1: Iya',
      },
      sisaAmount: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: '0',
      },
      noFaktur: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      SLA: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      isUnreweight: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '0: Tidak | 1: Iya',
      },
      codeCampaign: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: '8 Digit',
      },
      isShow: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: '0: tidak | 1: iya',
      },
      harga_jual: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Harga jasa pengiriman saja',
      },
      cost_pickup: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      cost_delivery: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      countUpdateKoli: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Berapa banyak dilakukan update koli',
      },
      assign_to_checker: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      customer_by: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      billing_name: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      billing_phone: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      arr_multidrop: {
        type: Sequelize.TEXT('long'),
        allowNull: true,
      },
      est_delivery_date: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      est_delivery_total: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status_cost_1: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '0: Belum | 1: Sudah',
      },
      status_cost_2: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '0: Belum | 1: Sudah',
      },
      isUpdateMarking: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: '0',
        comment: '0: Tidak | 1: Iya',
      },
      waypoints: {
        type: Sequelize.TEXT('long'),
        allowNull: true,
      },
      avoidLocation: {
        type: Sequelize.TEXT('long'),
        allowNull: true,
      },
      isTolPrice: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      isTrackingUGL: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      isTrackingXENA: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      typeFTL: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '0: Primary FTL | 1: Secondary FTL | 2: Last-Mile FTL',
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('orders');
  }
};
