import { FleetEstimateApprovalStatus, FleetEstimateRoadType, FleetEstimateTripType } from '../../models/fleet-estimate.model';

export class FleetEstimateDriverSummaryDto {
  id: number;
  name: string;
  phone: string;
}

export class FleetEstimateLoadingPhotoDto {
  id: number;
  file_path: string;
  file_name: string;
}

export class FleetEstimateItemDto {
  id: number;
  kota_asal: string;
  kota_tujuan: string;
  trip_type: FleetEstimateTripType;
  road_type: FleetEstimateRoadType;
  distance_km: number;
  distance_km_effective: number;
  vehicle_type: string;
  driver_1_user_id: number | null;
  driver_2_user_id: number | null;
  driver_1: FleetEstimateDriverSummaryDto | null;
  driver_2: FleetEstimateDriverSummaryDto | null;
  driver_1_wage: number;
  driver_2_wage: number | null;
  fuel_estimate: number;
  grand_total_operational: number;
  driver_1_account_no: string | null;
  driver_2_account_no: string | null;
  loading_photo_file_log_id: number | null;
  loading_photo: FleetEstimateLoadingPhotoDto | null;
  approval_status: FleetEstimateApprovalStatus;
  approved_by_user_id: number | null;
  approved_at: Date | null;
  departure_id: number | null;
  created_by_user_id: number | null;
  created_at: Date;
  updated_at: Date | null;
}

export class ListFleetEstimatesResponseDto {
  page: number;
  limit: number;
  total: number;
  data: FleetEstimateItemDto[];
}
