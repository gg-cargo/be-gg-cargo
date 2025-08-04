import { IsString, IsNotEmpty, MinLength, MaxLength, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class ChangePasswordDto {
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    target_user_id?: number;

    @IsString({ message: 'Password baru harus berupa string' })
    @IsNotEmpty({ message: 'Password baru wajib diisi' })
    @MinLength(6, { message: 'Password baru minimal 6 karakter' })
    @MaxLength(50, { message: 'Password baru maksimal 50 karakter' })
    new_password: string;

    @IsString({ message: 'Konfirmasi password harus berupa string' })
    @IsNotEmpty({ message: 'Konfirmasi password baru wajib diisi' })
    confirm_password: string;
} 