import { IsArray, IsInt, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

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

export class BypassInboundBulkItemDto {
    @IsString()
    @IsNotEmpty()
    no_tracking: string;
}

export class BypassInboundBulkDto {
    @IsInt()
    hub_id: number;

    @IsInt()
    action_by_user_id: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => BypassInboundBulkItemDto)
    items: BypassInboundBulkItemDto[];
}

export class BypassInboundBulkResultDto {
    no_tracking: string;
    status: 'success' | 'failed';
    message: string;
}

export class BypassInboundBulkResponseDto {
    status: 'success';
    message: string;
    results: BypassInboundBulkResultDto[];
}


