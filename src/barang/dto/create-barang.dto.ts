import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateBarangDto {
    @IsString()
    @IsNotEmpty({ message: 'nama_barang wajib diisi' })
    @MaxLength(255, { message: 'nama_barang maksimal 255 karakter' })
    nama_barang: string;
}
