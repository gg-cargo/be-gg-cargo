import { IsString, IsEmail, IsBoolean, IsNumber, IsOptional, IsArray } from 'class-validator';

export class SendEmailDto {
    @IsString()
    invoice_no: string;

    @IsEmail({}, { each: true })
    @IsArray()
    to_emails: string[];

    @IsOptional()
    @IsEmail({}, { each: true })
    @IsArray()
    cc_emails?: string[];

    @IsString()
    subject: string;

    @IsString()
    body: string;

    @IsBoolean()
    send_download_link: boolean;

    @IsNumber()
    sent_by_user_id: number;
}

