import { IsOptional, IsString, IsNumber, IsIn, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class ListUsersDto {
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(100)
    limit?: number = 10;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsString()
    @IsIn(['name', 'email', 'phone', 'code', 'level', 'status', 'saldo'])
    sort_by?: string = 'name';

    @IsOptional()
    @IsString()
    @IsIn(['asc', 'desc'])
    order?: string = 'asc';

    @IsOptional()
    @IsString()
    level?: string;

    @IsOptional()
    @IsString()
    status?: string;
} 