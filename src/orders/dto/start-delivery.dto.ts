import { IsArray, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class StartDeliveryDto {
    @IsString()
    @IsOptional()
    alasan?: string;

    @IsString()
    @IsOptional()
    catatan?: string;
}

export class StartDeliveryResponseDto {
    message: string;
    data: {
        no_tracking: string;
        status: string;
    };
}

export class StartDeliveryBulkItemDto {
    @IsString()
    no_tracking: string;
}

export class StartDeliveryBulkDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => StartDeliveryBulkItemDto)
    items: StartDeliveryBulkItemDto[];

    @IsString()
    @IsOptional()
    alasan?: string;

    @IsString()
    @IsOptional()
    catatan?: string;

    // Optional: untuk menyimpan alasan/catatan yang sama untuk semua item.
    @IsInt()
    @IsOptional()
    hub_id?: number;
}

export class StartDeliveryBulkResultDto {
    no_tracking: string;
    status: 'success' | 'failed';
    message: string;
}

export class StartDeliveryBulkResponseDto {
    status: 'success';
    message: string;
    results: StartDeliveryBulkResultDto[];
}




