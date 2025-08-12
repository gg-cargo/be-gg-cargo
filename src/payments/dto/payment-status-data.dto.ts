import { IsString, IsIn } from 'class-validator';

export class PaymentStatusDataDto {
    @IsString()
    no_tracking: string;

    @IsIn(['pending', 'paid', 'failed', 'expired'])
    payment_status: string;
}
