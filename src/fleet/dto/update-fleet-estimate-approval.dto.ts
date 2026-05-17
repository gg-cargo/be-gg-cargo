import { IsEnum, IsNotEmpty } from 'class-validator';
import { FleetEstimateApprovalStatus } from '../../models/fleet-estimate.model';

/** Status yang boleh di-set lewat endpoint approval (bukan pending). */
export type FleetEstimateApprovalAction = Extract<
  FleetEstimateApprovalStatus,
  'approved' | 'rejected'
>;

export class UpdateFleetEstimateApprovalDto {
  @IsNotEmpty({ message: 'approval_status wajib diisi' })
  @IsEnum(['approved', 'rejected'], {
    message: 'approval_status harus approved atau rejected',
  })
  approval_status: FleetEstimateApprovalAction;
}
