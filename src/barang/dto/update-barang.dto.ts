import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateBarangDto {
    @IsOptional()
    @IsString()
    @MaxLength(255, { message: 'nama_barang maksimal 255 karakter' })
    nama_barang?: string;
}
