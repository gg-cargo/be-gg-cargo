import { IsOptional, IsString, IsArray, ArrayMaxSize } from 'class-validator';

export class UpdateDeliveryNoteDto {
    @IsOptional()
    @IsString()
    delivery_notes?: string;

    @IsOptional()
    @IsArray()
    @ArrayMaxSize(3)
    proof_photos?: string[];

    @IsOptional()
    @IsString()
    customer_signature?: string;

    @IsOptional()
    @IsString()
    driver_signature?: string;
}
