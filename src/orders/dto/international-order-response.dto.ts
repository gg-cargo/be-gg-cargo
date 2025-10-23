export class InternationalOrderResponseDto {
    status: string;
    message: string;
    order: {
        no_tracking: string;
        total_amount: number;
        currency: string;
        chargeable_weight_total: number;
    };
    next_step: string;
}


