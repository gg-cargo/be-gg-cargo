import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  ValidateIf,
} from 'class-validator';

export class RegisterTransporterDto {
  /** Wajib untuk transporter (level 4). Pilihan: mitra | vendor */
  @ValidateIf((o) => o.role == null || o.role === '' || Number(o.role) === 4)
  @IsNotEmpty({ message: 'type_transporter wajib diisi untuk transporter' })
  @IsIn(['mitra', 'vendor'], {
    message: 'type_transporter harus mitra atau vendor',
  })
  type_transporter: string;

  @IsOptional()
  email?: string;

  @IsOptional()
  phone?: string;

  @IsOptional()
  password?: string;

  @IsOptional()
  role?: number;

  @IsOptional()
  hub_id?: number | string;

  @IsOptional()
  transport_mode?: string;

  @IsOptional()
  first_name?: string;

  @IsOptional()
  last_name?: string;

  @IsOptional()
  alamat?: string;

  @IsOptional()
  agent_name?: string;

  @IsOptional()
  agent_address?: string;

  @IsOptional()
  agent_city?: string;

  @IsOptional()
  agent_phone?: string;

  @IsOptional()
  agent_email?: string;

  @IsOptional()
  ktp?: Record<string, unknown>;

  @IsOptional()
  sim?: Record<string, unknown>;

  @IsOptional()
  foto_kurir_sim?: string;

  @IsOptional()
  foto_ktp?: string;

  @IsOptional()
  foto_sim?: string;

  @IsOptional()
  foto_kendaraan?: string[];

  @IsOptional()
  kontak_emergency?: Array<{ nomor: string; keterangan?: string }>;

  @IsOptional()
  kir?: string;

  @IsOptional()
  stnk?: string;
}
