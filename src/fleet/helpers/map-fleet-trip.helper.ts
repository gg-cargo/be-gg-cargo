import { FleetTrip } from '../../models/fleet-trip.model';
import { FleetTripWaypoint } from '../../models/fleet-trip-waypoint.model';
import { FleetTripSegment } from '../../models/fleet-trip-segment.model';
import { FleetTripAssignment } from '../../models/fleet-trip-assignment.model';
import {
  FleetTripDetailDto,
  FleetTripListItemDto,
} from '../dto/fleet-trip-response.dto';

function val<T>(row: { getDataValue(key: string): unknown }, key: string): T {
  return row.getDataValue(key) as T;
}

export function mapFleetTripWaypoint(w: FleetTripWaypoint) {
  return {
    sequence: val<number>(w, 'sequence'),
    label: val<string>(w, 'label'),
    lat: val<number>(w, 'lat'),
    lng: val<number>(w, 'lng'),
    address: val<string | null>(w, 'address'),
  };
}

export function mapFleetTripSegment(s: FleetTripSegment) {
  const roadType = val<string>(s, 'road_type');
  const distanceKm = Number(val(s, 'distance_km'));
  return {
    segment_no: val<number>(s, 'segment_no'),
    titik_asal: val<string>(s, 'titik_asal'),
    titik_tujuan: val<string>(s, 'titik_tujuan'),
    titik_asal_lat: val<number>(s, 'titik_asal_lat'),
    titik_asal_lng: val<number>(s, 'titik_asal_lng'),
    titik_tujuan_lat: val<number>(s, 'titik_tujuan_lat'),
    titik_tujuan_lng: val<number>(s, 'titik_tujuan_lng'),
    road_type: roadType,
    distance_km: distanceKm,
    route: {
      variant: val<string | null>(s, 'route_variant') ?? roadType,
      jarak_km: Number(val(s, 'route_jarak_km') ?? distanceKm),
      estimasi_waktu: val<string | null>(s, 'route_estimasi_waktu') ?? '',
      biaya_tol_idr: val<number | null>(s, 'route_biaya_tol_idr'),
    },
    estimate: {
      bbm_total: Number(val(s, 'estimate_bbm_total')),
      fuel_type: val<string | null>(s, 'estimate_fuel_type') ?? '',
      toll_total: val<number | null>(s, 'estimate_toll_total'),
      distance_km_effective: Number(val(s, 'estimate_distance_km_effective')),
      grand_total_operational: Number(val(s, 'estimate_grand_total_operational')),
    },
  };
}

export function mapFleetTripAssignment(a: FleetTripAssignment | null | undefined) {
  if (!a) {
    return {
      assignee_type: 'mitra',
      assigned_by_user_id: null,
      driver_1_user_id: null,
      driver_2_user_id: null,
      vendor_id: null,
    };
  }
  return {
    assignee_type: val<string>(a, 'assignee_type'),
    assigned_by_user_id: val<number | null>(a, 'assigned_by_user_id'),
    driver_1_user_id: val<number | null>(a, 'driver_1_user_id'),
    driver_2_user_id: val<number | null>(a, 'driver_2_user_id'),
    vendor_id: val<number | null>(a, 'vendor_id'),
  };
}

export function mapFleetTripToDetail(trip: FleetTrip): FleetTripDetailDto {
  const waypointRows =
    (trip.getDataValue('waypoints') as FleetTripWaypoint[] | undefined) ?? [];
  const segmentRows =
    (trip.getDataValue('segments') as FleetTripSegment[] | undefined) ?? [];
  const assignmentRow = trip.getDataValue('assignment') as
    | FleetTripAssignment
    | undefined;

  const supir2 = val<number | null>(trip, 'supir_2_total');

  return {
    id: val<number>(trip, 'id'),
    tracking_no: val<string>(trip, 'tracking_no'),
    status: val<string>(trip, 'status'),
    waypoints: waypointRows.map(mapFleetTripWaypoint),
    segments: segmentRows.map(mapFleetTripSegment),
    summary: {
      kota_asal: val<string>(trip, 'kota_asal'),
      kota_tujuan: val<string>(trip, 'kota_tujuan'),
      trip_type: val<string>(trip, 'trip_type'),
      road_type: val<string>(trip, 'road_type'),
      distance_km_total: Number(val(trip, 'distance_km_total')),
      vehicle_type: val<string>(trip, 'vehicle_type'),
      estimasi_bbm_total: Number(val(trip, 'estimasi_bbm_total')),
      estimasi_tol_total: Number(val(trip, 'estimasi_tol_total')),
      estimasi_waktu_tiba: val<string | null>(trip, 'estimasi_waktu_tiba') ?? '',
      supir_1_total: Number(val(trip, 'supir_1_total')),
      supir_2_total: supir2 != null ? Number(supir2) : null,
      supir_2_eligible: Boolean(val(trip, 'supir_2_eligible')),
      grand_total_operational: Number(val(trip, 'grand_total_operational')),
      fuel_type: val<string | null>(trip, 'fuel_type'),
    },
    assignment: mapFleetTripAssignment(assignmentRow),
    created_at: val<Date>(trip, 'created_at'),
    updated_at: val<Date | null>(trip, 'updated_at'),
  };
}

export function mapFleetTripListItem(trip: FleetTrip): FleetTripListItemDto {
  const assignmentRow = trip.getDataValue('assignment') as
    | FleetTripAssignment
    | undefined;

  return {
    id: val<number>(trip, 'id'),
    tracking_no: val<string>(trip, 'tracking_no'),
    status: val<string>(trip, 'status'),
    kota_asal: val<string>(trip, 'kota_asal'),
    kota_tujuan: val<string>(trip, 'kota_tujuan'),
    vehicle_type: val<string>(trip, 'vehicle_type'),
    distance_km_total: Number(val(trip, 'distance_km_total')),
    grand_total_operational: Number(val(trip, 'grand_total_operational')),
    assignee_type: assignmentRow
      ? val<string>(assignmentRow, 'assignee_type')
      : undefined,
    created_at: val<Date>(trip, 'created_at'),
  };
}
