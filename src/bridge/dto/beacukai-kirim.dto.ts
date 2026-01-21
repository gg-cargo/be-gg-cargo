import { IsNotEmpty, IsString } from 'class-validator';

export class BeacukaiKirimDto {
    @IsString()
    @IsNotEmpty({ message: 'xml wajib diisi' })
    xml: string;
}
