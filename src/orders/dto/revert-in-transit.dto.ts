import { IsOptional, IsString, IsInt } from 'class-validator';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class RevertInTransitDto {
    @IsString()
    @IsOptional()
    alasan?: string;

    @IsString()
    @IsOptional()
    catatan?: string;

    @IsInt()
    @IsOptional()
    hub_id?: number;
}

export class RevertInTransitResponseDto {
    message: string;
    data: {
        no_tracking: string;
        status: string | null;
        reweight_status: number;
        hub_dest_id: number | null;
    };
}

export class RevertInTransitBulkItemDto {
    @IsString()
    no_tracking: string;
}

export class RevertInTransitBulkDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RevertInTransitBulkItemDto)
    items: RevertInTransitBulkItemDto[];

    @IsString()
    @IsOptional()
    alasan?: string;

    @IsString()
    @IsOptional()
    catatan?: string;

    @IsInt()
    @IsOptional()
    hub_id?: number;
}

export class RevertInTransitBulkResultDto {
    no_tracking: string;
    status: 'success' | 'failed';
    message: string;
}

export class RevertInTransitBulkResponseDto {
    status: 'success';
    message: string;
    results: RevertInTransitBulkResultDto[];
}


