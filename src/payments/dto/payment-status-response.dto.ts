import { IsString } from 'class-validator';
import { PaymentStatusDataDto } from './payment-status-data.dto';

export class PaymentStatusResponseDto {
    @IsString()
    message: string;

    data: PaymentStatusDataDto;
}
