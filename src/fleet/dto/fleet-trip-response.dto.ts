export class FleetTripWaypointResponseDto {
  sequence: number;
  label: string;
  lat: number;
  lng: number;
  address?: string | null;
}

export class FleetTripSegmentRouteResponseDto {
  variant: string;
  jarak_km: number;
  estimasi_waktu: string;
  biaya_tol_idr?: number | null;
}

export class FleetTripSegmentEstimateResponseDto {
  bbm_total: number;
  fuel_type: string;
  toll_total?: number | null;
  distance_km_effective: number;
  grand_total_operational: number;
}

export class FleetTripSegmentResponseDto {
  segment_no: number;
  titik_asal: string;
  titik_tujuan: string;
  titik_asal_lat: number;
  titik_asal_lng: number;
  titik_tujuan_lat: number;
  titik_tujuan_lng: number;
  road_type: string;
  distance_km: number;
  route: FleetTripSegmentRouteResponseDto;
  estimate: FleetTripSegmentEstimateResponseDto;
}

export class FleetTripSummaryResponseDto {
  kota_asal: string;
  kota_tujuan: string;
  trip_type: string;
  road_type: string;
  distance_km_total: number;
  vehicle_type: string;
  estimasi_bbm_total: number;
  estimasi_tol_total: number;
  estimasi_waktu_tiba: string;
  supir_1_total: number;
  supir_2_total?: number | null;
  supir_2_eligible: boolean;
  grand_total_operational: number;
  fuel_type?: string | null;
}

export class FleetTripAssignmentResponseDto {
  assignee_type: string;
  assigned_by_user_id: number | null;
  driver_1_user_id?: number | null;
  driver_2_user_id?: number | null;
  driver_1_name?: string | null;
  driver_2_name?: string | null;
  driver_1_account_no?: string | null;
  driver_2_account_no?: string | null;
  vendor_id?: number | null;
}

export class FleetTripLoadingPhotoDto {
  id: number;
  file_path: string;
  file_name: string;
}

export class FleetTripLoadingPhotosDataDto {
  loading_photos: FleetTripLoadingPhotoDto[];
}

export class FleetTripLoadingPhotosResponseDto {
  success: boolean;
  message: string;
  data: FleetTripLoadingPhotosDataDto;
}

export class FleetTripDetailDto {
  id: number;
  tracking_no: string;
  status: string;
  waypoints: FleetTripWaypointResponseDto[];
  segments: FleetTripSegmentResponseDto[];
  summary: FleetTripSummaryResponseDto;
  assignment: FleetTripAssignmentResponseDto;
  file_log_ids: number[];
  loading_photos: FleetTripLoadingPhotoDto[];
  approve_status: string;
  approve_by_user_id: number | null;
  approve_at: Date | null;
  created_at: Date;
  updated_at?: Date | null;
}

export class FleetTripResponseDto {
  success: boolean;
  message: string;
  data: FleetTripDetailDto;
}

export class FleetTripListItemDto {
  id: number;
  tracking_no: string;
  status: string;
  kota_asal: string;
  kota_tujuan: string;
  vehicle_type: string;
  distance_km_total: number;
  grand_total_operational: number;
  assignee_type?: string;
  approve_status: string;
  approve_by_user_id: number | null;
  approve_by_user_name: string | null;
  approve_at: Date | null;
  plat_kendaraan: string | null;
  created_at: Date;
}

export class FleetTripListResponseDto {
  success: boolean;
  message: string;
  data: {
    total: number;
    page: number;
    limit: number;
    items: FleetTripListItemDto[];
  };
}
