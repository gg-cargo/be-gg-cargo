import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class BeacukaiResponDto {
    @IsString()
    @IsNotEmpty({ message: 'no_barang wajib diisi' })
    no_barang: string;

    @IsString()
    @IsNotEmpty({ message: 'tgl_house_blawb wajib diisi' })
    @Matches(/^\d{4}\/\d{2}\/\d{2}$/, {
        message: 'tgl_house_blawb harus format YYYY/MM/DD',
    })
    tgl_house_blawb: string;
}
