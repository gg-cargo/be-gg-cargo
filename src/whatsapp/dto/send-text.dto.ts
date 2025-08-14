import { IsString, IsNotEmpty, IsPhoneNumber } from 'class-validator';

export class SendTextDto {
    @IsPhoneNumber('ID')
    @IsNotEmpty()
    phoneNumber!: string;

    @IsString()
    @IsNotEmpty()
    message!: string;
}
