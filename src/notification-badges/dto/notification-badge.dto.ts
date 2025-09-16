import { IsString, IsNumber, IsOptional, IsIn } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateNotificationBadgeDto {
    @IsNumber()
    @Type(() => Number)
    @IsOptional()
    user_id?: number;

    @IsString()
    menu_name: string;

    @IsNumber()
    @Type(() => Number)
    item_id: number;

    @IsString()
    @IsIn(['order', 'reweight', 'pickup', 'delivery', 'invoice'])
    item_type: string;

    @IsNumber()
    @Type(() => Number)
    hub_id: number;
}

export class MarkAsReadDto {
    @IsNumber()
    @Type(() => Number)
    notification_id: number;
}

export class MarkAllAsReadDto {
    @IsNumber()
    @Type(() => Number)
    @IsOptional()
    hub_id?: number;

    @IsString()
    @IsOptional()
    @Transform(({ value }) => value ? value.toLowerCase() : value)
    @IsIn(['order masuk', 'reweight', 'dalam pengiriman', 'order kirim', 'hub kosong', 'hub missing'])
    menu_name?: string;
}

export class GetNotificationBadgesDto {
    @IsNumber()
    @Type(() => Number)
    @IsOptional()
    hub_id?: number;

    @IsString()
    @IsOptional()
    @Transform(({ value }) => value ? value.toLowerCase() : value)
    @IsIn(['order masuk', 'reweight', 'dalam pengiriman', 'order kirim', 'hub kosong', 'hub missing'])
    menu_name?: string;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    limit?: number = 50;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    offset?: number = 0;
}

export class NotificationBadgeResponseDto {
    id: number;
    user_id: number | null;
    menu_name: string;
    item_id: number;
    item_type: string;
    hub_id: number;
    is_read: number;
    created_at: Date;
    updated_at: Date;
}

export class NotificationBadgeCountResponseDto {
    menu_name: string;
    hub_id: number;
    unread_count: number;
    total_count: number;
}
