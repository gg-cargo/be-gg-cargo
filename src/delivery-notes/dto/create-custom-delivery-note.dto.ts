import { ArrayNotEmpty, IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CustomDeliveryNoteHubDto {
    @IsString({ message: 'nama hub harus berupa string' })
    @IsNotEmpty({ message: 'nama hub tidak boleh kosong' })
    nama: string;

    @IsOptional()
    @IsString({ message: 'alamat hub harus berupa string' })
    alamat?: string;
}

export class CustomDeliveryNoteTransporterDto {
    @IsString({ message: 'nama transporter harus berupa string' })
    @IsNotEmpty({ message: 'nama transporter tidak boleh kosong' })
    nama: string;

    @IsOptional()
    @IsString({ message: 'jenis_kendaraan harus berupa string' })
    jenis_kendaraan?: string;

    @IsString({ message: 'no_polisi harus berupa string' })
    @IsNotEmpty({ message: 'no_polisi tidak boleh kosong' })
    no_polisi: string;
}

export class CustomDeliveryNoteOrderDto {
    @IsString({ message: 'no_tracking harus berupa string' })
    @IsNotEmpty({ message: 'no_tracking tidak boleh kosong' })
    no_tracking: string;

    @IsOptional()
    @IsString({ message: 'nama_pengirim harus berupa string' })
    nama_pengirim?: string;

    @IsOptional()
    @IsString({ message: 'nama_penerima harus berupa string' })
    nama_penerima?: string;

    @IsOptional()
    @IsString({ message: 'asal harus berupa string' })
    asal?: string;

    @IsOptional()
    @IsString({ message: 'tujuan harus berupa string' })
    tujuan?: string;

    @Type(() => Number)
    @IsNumber({}, { message: 'jumlah_koli harus berupa angka' })
    jumlah_koli: number;

    @Type(() => Number)
    @IsNumber({}, { message: 'berat_barang harus berupa angka' })
    berat_barang: number;
}

export class CreateCustomDeliveryNoteDto {
    @IsOptional()
    @IsString({ message: 'no_delivery_note harus berupa string' })
    no_delivery_note?: string;

    @ValidateNested()
    @Type(() => CustomDeliveryNoteHubDto)
    from_hub: CustomDeliveryNoteHubDto;

    @ValidateNested()
    @Type(() => CustomDeliveryNoteHubDto)
    to_hub: CustomDeliveryNoteHubDto;

    @ValidateNested()
    @Type(() => CustomDeliveryNoteTransporterDto)
    transporter: CustomDeliveryNoteTransporterDto;

    @IsArray({ message: 'orders harus berupa array' })
    @ArrayNotEmpty({ message: 'orders tidak boleh kosong' })
    @ValidateNested({ each: true })
    @Type(() => CustomDeliveryNoteOrderDto)
    orders: CustomDeliveryNoteOrderDto[];

    @IsOptional()
    @IsArray({ message: 'piece_ids harus berupa array string' })
    @IsString({ each: true, message: 'setiap piece_id harus berupa string' })
    piece_ids?: string[];

    @IsOptional()
    @IsArray({ message: 'no_seal harus berupa array string' })
    @IsString({ each: true, message: 'setiap no_seal harus berupa string' })
    no_seal?: string[];
}
