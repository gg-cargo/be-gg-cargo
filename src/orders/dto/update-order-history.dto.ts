import { IsOptional, IsString } from 'class-validator';

export class UpdateOrderHistoryDto {
    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsString()
    keterangan?: string;
}
