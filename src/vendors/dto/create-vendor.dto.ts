import {
  IsString,
  IsEmail,
  IsOptional,
  IsArray,
  IsIn,
  MinLength,
  MaxLength,
  Matches,
  ArrayMinSize,
} from 'class-validator';

export class CreateVendorDto {
  @IsString()
  @MinLength(2, { message: 'Nama vendor minimal 2 karakter' })
  @MaxLength(255, { message: 'Nama vendor maksimal 255 karakter' })
  nama_vendor: string;

  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Kode vendor maksimal 50 karakter' })
  // Contoh valid: VND-004, ABC123, ABC-123-XYZ
  // Hanya boleh huruf besar, angka, dan pemisah '-'
  @Matches(/^[A-Z0-9]+(?:-[A-Z0-9]+)*$/, { message: "Kode vendor harus huruf besar, angka, dan pemisah '-' saja" })
  kode_vendor?: string;

  @IsOptional()
  @IsString()
  alamat_vendor?: string;

  @IsString()
  @MinLength(2, { message: 'Nama PIC minimal 2 karakter' })
  @MaxLength(255, { message: 'Nama PIC maksimal 255 karakter' })
  pic_nama: string;

  @IsString()
  @Matches(/^[0-9+\-\s()]+$/, { message: 'Format telepon tidak valid' })
  @MaxLength(50, { message: 'Telepon maksimal 50 karakter' })
  pic_telepon: string;

  @IsEmail({}, { message: 'Format email PIC tidak valid' })
  @MaxLength(255, { message: 'Email PIC maksimal 255 karakter' })
  pic_email: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true, message: 'Setiap jenis layanan harus berupa string' })
  @ArrayMinSize(1, { message: 'Jenis layanan minimal 1 jenis' })
  jenis_layanan?: string[];

  @IsOptional()
  @IsString()
  @IsIn(['Aktif', 'Nonaktif', 'Dalam Proses'], {
    message: 'Status vendor harus: Aktif, Nonaktif, atau Dalam Proses',
  })
  status_vendor?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'Area coverage minimal 1 area' })
  @IsString({ each: true, message: 'Setiap area harus berupa string' })
  area_coverage?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Catatan maksimal 1000 karakter' })
  catatan?: string;
}

