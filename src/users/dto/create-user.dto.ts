import { IsString, IsEmail, IsNumber, IsOptional, IsIn, MinLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateUserDto {
    @IsString()
    @MinLength(2, { message: 'Nama minimal 2 karakter' })
    name: string;

    @IsEmail({}, { message: 'Format email tidak valid' })
    email: string;

    @IsString()
    phone: string;

    @IsString()
    @MinLength(8, { message: 'Password minimal 8 karakter' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
        message: 'Password harus mengandung huruf besar, huruf kecil, angka, dan karakter khusus'
    })
    password: string;

    @IsNumber()
    level_id: number;

    @IsOptional()
    @IsNumber()
    @Transform(({ value }) => {
        if (value === undefined || value === null || value === '') return null;
        const num = Number(value);
        return Number.isNaN(num) ? value : num;
    })
    hub_id?: number;

    @IsOptional()
    @IsNumber()
    @Transform(({ value }) => {
        if (value === undefined || value === null || value === '') return null;
        const num = Number(value);
        return Number.isNaN(num) ? value : num;
    })
    service_center_id?: number;

    @IsOptional()
    @IsNumber()
    @IsIn([0, 1])
    aktif?: number = 1;

    @IsOptional()
    @IsString()
    nik?: string;

    @IsOptional()
    @IsString()
    sim?: string;

    @IsOptional()
    @IsString()
    stnk?: string;

    @IsOptional()
    @IsString()
    kir?: string;

    @IsOptional()
    @IsString()
    expired_sim?: string;

    @IsOptional()
    @IsString()
    expired_stnk?: string;

    @IsOptional()
    @IsString()
    expired_kir?: string;

    @IsOptional()
    @IsString()
    no_polisi?: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsString()
    location?: string;
} 