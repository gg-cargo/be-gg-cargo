import { IsNumber, IsPositive, IsNotEmpty, Min, Max } from 'class-validator';

export class ReweightPieceDto {
    @IsNumber()
    @IsPositive({ message: 'Berat harus lebih dari 0' })
    @Max(10000, { message: 'Berat tidak boleh lebih dari 10.000 kg' })
    berat: number;

    @IsNumber()
    @IsPositive({ message: 'Panjang harus lebih dari 0' })
    @Max(1000, { message: 'Panjang tidak boleh lebih dari 1000 cm' })
    panjang: number;

    @IsNumber()
    @IsPositive({ message: 'Lebar harus lebih dari 0' })
    @Max(1000, { message: 'Lebar tidak boleh lebih dari 1000 cm' })
    lebar: number;

    @IsNumber()
    @IsPositive({ message: 'Tinggi harus lebih dari 0' })
    @Max(1000, { message: 'Tinggi tidak boleh lebih dari 1000 cm' })
    tinggi: number;

    @IsNumber()
    @IsNotEmpty({ message: 'ID user yang melakukan reweight wajib diisi' })
    reweight_by_user_id: number;
} 