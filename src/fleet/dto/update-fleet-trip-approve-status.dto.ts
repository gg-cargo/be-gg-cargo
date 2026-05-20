import { IsEnum, IsNotEmpty } from 'class-validator';
import { FleetTripApproveStatus } from '../../models/fleet-trip.model';

export type FleetTripApproveAction = Extract<
  FleetTripApproveStatus,
  'approved' | 'rejected'
>;

export class UpdateFleetTripApproveStatusDto {
  @IsNotEmpty({ message: 'approve_status wajib diisi' })
  @IsEnum(['approved', 'rejected'], {
    message: 'approve_status harus approved atau rejected',
  })
  approve_status: FleetTripApproveAction;
}
