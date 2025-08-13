import { IsString, IsNotEmpty } from 'class-validator';

export class CancelPaymentDto {
    @IsString()
    @IsNotEmpty({ message: 'Nomor tracking tidak boleh kosong' })
    no_tracking: string;
}

export class CancelPaymentResponseDto {
    @IsString()
    message: string;
}
