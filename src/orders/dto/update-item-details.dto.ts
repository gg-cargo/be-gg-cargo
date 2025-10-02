import { IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateItemDetailsDto {
    @IsOptional()
    @IsNumber()
    @Min(0)
    total_koli?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    total_berat?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    total_kubikasi?: number;
}
