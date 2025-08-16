export class InvoiceSendDataDto {
    invoice_no: string;
    no_tracking: string;
    billing_name: string;
    billing_email: string;
    billing_nomer: string;
    harga: number;
    email_subject: string;
    body_email: string;
    body_wa: string;
}

export class GetInvoiceSendDataResponseDto {
    status: string;
    invoice_data: InvoiceSendDataDto;
}
