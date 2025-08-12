import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class SendEmailResponseDto {
    @IsString()
    message: string;

    @IsBoolean()
    success: boolean;

    @IsOptional()
    @IsString()
    message_id?: string;

    @IsOptional()
    @IsString()
    error?: string;
}

