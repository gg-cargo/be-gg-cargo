import { IsOptional, IsString, IsNumber, IsArray, ArrayMaxSize } from 'class-validator';

export class UpdatePickupNoteDto {
    @IsOptional()
    @IsString()
    pickup_courier_name?: string;

    @IsOptional()
    @IsString()
    pickup_time?: string;

    @IsOptional()
    @IsString()
    pickup_notes?: string;

    @IsOptional()
    @IsArray()
    @ArrayMaxSize(3)
    @IsString({ each: true })
    proof_photos?: string[]; // Array of file paths

    @IsOptional()
    @IsString()
    customer_signature?: string; // base64 signature

    @IsOptional()
    @IsString()
    driver_signature?: string; // base64 signature
}

