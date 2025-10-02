import { IsInt, IsString, IsDateString, IsNotEmpty } from 'class-validator';

export class AssignTruckRentalDto {
    @IsInt()
    @IsNotEmpty()
    transporter_user_id: number;

    @IsInt()
    @IsNotEmpty()
    truck_id: number;

    @IsDateString()
    @IsNotEmpty()
    estimated_departure_time: string;

    @IsInt()
    @IsNotEmpty()
    assigned_by_user_id: number;
}
