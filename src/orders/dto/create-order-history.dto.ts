import { IsString, IsOptional } from 'class-validator';

export class CreateOrderHistoryDto {
    @IsString()
    status: string;

    @IsOptional()
    @IsString()
    keterangan?: string;
} 