import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class BypassInboundDto {
    @IsString()
    @IsNotEmpty()
    no_tracking: string;

    @IsInt()
    hub_id: number;

    @IsInt()
    action_by_user_id: number;
}

export class BypassInboundResponseDto {
    status: 'success';
    message: string;
    order: {
        no_tracking: string;
        current_status: string;
        bypassed_by: string;
    };
}


