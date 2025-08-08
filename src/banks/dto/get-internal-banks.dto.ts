import { IsOptional, IsString, IsIn } from 'class-validator';

export class GetInternalBanksDto {
    @IsOptional()
    @IsString()
    @IsIn(['pt', 'sc', 'hc', 'kc'], { message: 'Type harus salah satu dari: pt, sc, hc, kc' })
    type?: string;

    @IsOptional()
    @IsString()
    bank_name?: string;
} 