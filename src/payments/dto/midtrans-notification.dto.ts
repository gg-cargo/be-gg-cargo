export class MidtransNotificationDto {
    transaction_id: string;
    transaction_status: string;
    fraud_status: string;
    order_id: string;
    gross_amount: string;
    signature_key: string;
    status_code: string;
    payment_type: string;
    merchant_id: string;
    va_numbers?: Array<{
        bank: string;
        va_number: string;
    }>;
    settlement_time?: string;
    transaction_time: string;
    expiry_time?: string;
}
