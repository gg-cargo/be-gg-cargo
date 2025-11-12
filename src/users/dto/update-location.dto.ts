import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateLocationDto {
    @IsString()
    @IsNotEmpty()
    latlng!: string;
}

export class UpdateLocationResponseDto {
    message: string;
    success: boolean;
    data: {
        latlng: string;
        last_update_gps: Date;
    };
}

