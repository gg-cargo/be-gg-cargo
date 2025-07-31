import { IsNumber, IsNotEmpty, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class ReweightPieceDto {
    @IsNotEmpty()
    @Transform(({ value }) => parseFloat(value))
    @IsNumber()
    @Min(0.1)
    @Max(1000)
    berat: number;

    @IsNotEmpty()
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    @Min(1)
    @Max(500)
    panjang: number;

    @IsNotEmpty()
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    @Min(1)
    @Max(500)
    lebar: number;

    @IsNotEmpty()
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    @Min(1)
    @Max(500)
    tinggi: number;

    @IsNotEmpty()
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    reweight_by_user_id: number;
} 