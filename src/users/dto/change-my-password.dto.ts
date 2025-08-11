import { IsString, IsNotEmpty, MinLength, Matches } from 'class-validator';

export class ChangeMyPasswordDto {
    @IsNotEmpty({ message: 'Password lama harus diisi' })
    @IsString({ message: 'Password lama harus berupa string' })
    old_password: string;

    @IsNotEmpty({ message: 'Password baru harus diisi' })
    @IsString({ message: 'Password baru harus berupa string' })
    @MinLength(8, { message: 'Password baru minimal 8 karakter' })
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        {
            message: 'Password baru harus mengandung minimal 1 huruf kecil, 1 huruf besar, 1 angka, dan 1 simbol'
        }
    )
    new_password: string;

    @IsNotEmpty({ message: 'Konfirmasi password baru harus diisi' })
    @IsString({ message: 'Konfirmasi password baru harus berupa string' })
    confirm_new_password: string;
}
