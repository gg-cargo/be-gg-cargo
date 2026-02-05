import { IsNotEmpty, IsString } from 'class-validator';

export class ParseExcelDto {
    @IsNotEmpty()
    @IsString()
    file_path: string;
}
