import { IsString, IsNotEmpty, IsOptional, IsIn, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class BypassReweightDto {
    @IsString({ message: 'Status bypass reweight harus berupa string' })
    @IsNotEmpty({ message: 'Status bypass reweight wajib diisi' })
    @IsIn(['true', 'false'], { message: 'Status bypass reweight harus "true" atau "false"' })
    bypass_reweight_status: string;

    @IsOptional()
    @IsString({ message: 'Alasan harus berupa string' })
    reason?: string;

    @IsNumber({}, { message: 'ID user harus berupa angka' })
    @Type(() => Number)
    updated_by_user_id: number;
} 