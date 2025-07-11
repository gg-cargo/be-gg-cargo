import { Column, DataType, Model, Table, HasOne } from 'sequelize-typescript';
import { Level } from './index';

@Table({
  tableName: 'users',
  timestamps: false,
})
export class User extends Model {
  @Column({
    type: DataType.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  code: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  phone: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  email: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  email_verified_at: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  phone_verify_at: Date;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  password: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  password_web_checker: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  level: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  hub_id: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  service_center_id: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  customer: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  payment_terms: number;

  @Column({
    type: DataType.DOUBLE,
    allowNull: false,
    defaultValue: 0,
  })
  discount_rate: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  fcm_token: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  remember_token: string;

  @Column({
    type: DataType.STRING(25),
    allowNull: true,
  })
  kode_referral: string;

  @Column({
    type: DataType.STRING(25),
    allowNull: true,
  })
  kode_referral_referensi: string;

  @Column({
    type: DataType.TEXT('long'),
    allowNull: true,
  })
  latlng: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: DataType.NOW,
  })
  created_at: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  updated_at: Date;

  @Column({
    type: DataType.STRING(200),
    allowNull: true,
  })
  nik: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
  })
  sim: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
  })
  stnk: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
  })
  kir: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
  })
  expired_sim: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
  })
  expired_stnk: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
  })
  expired_kir: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
  })
  file_id: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  jenis_mobil: number;

  @Column({
    type: DataType.STRING(10),
    allowNull: true,
  })
  id_truck_xpdc: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
  })
  no_polisi: string;

  @Column({
    type: DataType.TEXT('long'),
    allowNull: true,
  })
  ttd: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
    comment: '1: inhouse, 2:vendor/mitra',
  })
  type_transporter: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '0: Inhouse | 1: Mitra',
  })
  type_expeditor: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  stakeholder_id: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 1,
  })
  aktif: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '0: Tidak | 1: Ya',
  })
  aktif_disabled_super: number;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: DataType.NOW,
  })
  last_update_gps: Date;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '1: Buka | 0: Tutup',
  })
  status_app: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  size_ram: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
  })
  channel_id: string;

  @Column({
    type: DataType.STRING(10),
    allowNull: false,
    defaultValue: '0',
    comment: '0: bukan | 1: iya',
  })
  affiliator: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  archive_id: number;

  @Column({
    type: DataType.STRING(10),
    allowNull: false,
    defaultValue: '0',
    comment: '0 : tidak freeze | 1 : freeze',
  })
  freeze_saldo: string;

  @Column({
    type: DataType.STRING(10),
    allowNull: false,
    defaultValue: '0',
    comment: '0: Unfreeze | 1: Freeze',
  })
  freeze_gps: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '0: Tidak | 1: Ya',
  })
  freeze_foreground: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  address: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  location: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '0: Access | 1: Non Access',
  })
  accessUpdateName: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '0: Access | 1: Non Access',
  })
  accessUpdatePhone: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '0: Access | 1: Non Access',
  })
  accessUpdateEmail: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '0: Tidak | 1: Ya',
  })
  isSales: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  url_image: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
    comment: 'custome group id untuk update driver masuk ke group tersebut, biarkan kosong untuk masuk ke group TC',
  })
  group_id_truck: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '0: Tidak | 1: Ya',
  })
  isApprove: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '0: Tidak | 1: Iya',
  })
  isHandover: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  kontak_id_kledo: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    defaultValue: '0',
    comment: '0: Tidak | 1: Ya',
  })
  otomatis_status: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  otomatis_email: string;

  @Column({
    type: DataType.STRING(200),
    allowNull: true,
  })
  otomatis_cc: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  otomatis_alamat: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '0: Tidak | 1: Iya',
  })
  freeze_saldo_lock: number;

  @Column({
    type: DataType.TEXT('long'),
    allowNull: true,
  })
  remark: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    defaultValue: '0',
    comment: '0: Tidak | 1: Ya',
  })
  expeditor_as_transporter: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '0: Tidak | 1: Iya',
  })
  show_price: number;

  // Relations
  @HasOne(() => Level, { foreignKey: 'level', sourceKey: 'level' })
  levelData: Level;
} 