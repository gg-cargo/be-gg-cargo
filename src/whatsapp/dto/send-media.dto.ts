import { IsString, IsNotEmpty, IsPhoneNumber, IsOptional, IsUrl } from 'class-validator';

export class SendMediaDto {
    @IsPhoneNumber('ID')
    @IsNotEmpty()
    phoneNumber!: string;

    @IsString()
    @IsOptional()
    caption?: string;

    @IsUrl()
    @IsOptional()
    fileUrl?: string;

    @IsString()
    @IsOptional()
    filePath?: string;
}
