export class CreateVaResponseDto {
    message: string;
    data: {
        transaction_id: string;
        va_number: string;
        bank_name: string;
        expiry_time: string;
        payment_link: string;
    };
}
