'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      code: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email_verified_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      phone_verify_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      password_web_checker: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      level: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      hub_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      service_center_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      customer: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      payment_terms: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      discount_rate: {
        type: Sequelize.DOUBLE,
        allowNull: false,
        defaultValue: 0,
      },
      fcm_token: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      remember_token: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      kode_referral: {
        type: Sequelize.STRING(25),
        allowNull: true,
      },
      kode_referral_referensi: {
        type: Sequelize.STRING(25),
        allowNull: true,
      },
      latlng: {
        type: Sequelize.TEXT('long'),
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      nik: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      sim: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      stnk: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      kir: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      expired_sim: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      expired_stnk: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      expired_kir: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      file_id: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      jenis_mobil: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      id_truck_xpdc: {
        type: Sequelize.STRING(10),
        allowNull: true,
      },
      no_polisi: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      ttd: {
        type: Sequelize.TEXT('long'),
        allowNull: true,
      },
      type_transporter: {
        type: Sequelize.STRING(20),
        allowNull: true,
        comment: '1: inhouse, 2:vendor/mitra',
      },
      type_expeditor: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '0: Inhouse | 1: Mitra',
      },
      stakeholder_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      aktif: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      aktif_disabled_super: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '0: Tidak | 1: Ya',
      },
      last_update_gps: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      status_app: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: '1: Buka | 0: Tutup',
      },
      size_ram: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      channel_id: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      affiliator: {
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: '0',
        comment: '0: bukan | 1: iya',
      },
      archive_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      freeze_saldo: {
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: '0',
        comment: '0 : tidak freeze | 1 : freeze',
      },
      freeze_gps: {
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: '0',
        comment: '0: Unfreeze | 1: Freeze',
      },
      freeze_foreground: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '0: Tidak | 1: Ya',
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      location: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      accessUpdateName: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '0: Access | 1: Non Access',
      },
      accessUpdatePhone: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '0: Access | 1: Non Access',
      },
      accessUpdateEmail: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '0: Access | 1: Non Access',
      },
      isSales: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '0: Tidak | 1: Ya',
      },
      url_image: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      group_id_truck: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'custome group id untuk update driver masuk ke group tersebut, biarkan kosong untuk masuk ke group TC',
      },
      isApprove: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: '0: Tidak | 1: Ya',
      },
      isHandover: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '0: Tidak | 1: Iya',
      },
      kontak_id_kledo: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      otomatis_status: {
        type: Sequelize.STRING(100),
        allowNull: false,
        defaultValue: '0',
        comment: '0: Tidak | 1: Ya',
      },
      otomatis_email: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      otomatis_cc: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      otomatis_alamat: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      freeze_saldo_lock: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '0: Tidak | 1: Iya',
      },
      remark: {
        type: Sequelize.TEXT('long'),
        allowNull: true,
      },
      expeditor_as_transporter: {
        type: Sequelize.STRING(100),
        allowNull: false,
        defaultValue: '0',
        comment: '0: Tidak | 1: Ya',
      },
      show_price: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: '0: Tidak | 1: Iya',
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('users');
  }
};