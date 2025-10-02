export class AssignTruckRentalResponseDto {
    message: string;
    data: {
        no_tracking: string;
        transporter_user_id: number;
        truck_id: number;
        estimated_departure_time: string;
        assigned_by_user_id: number;
        status: string;
        updated_at: Date;
    };
}
