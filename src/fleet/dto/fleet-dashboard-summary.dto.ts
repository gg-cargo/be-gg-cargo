/**
 * DTO untuk response GET /fleet/dashboard-summary
 * Menampilkan metrik jumlah order per hub per status
 */
export class FleetDashboardHubSummaryDto {
  hub_id: number;
  hub_kode: string;
  hub_name: string;
  order_jemput: number;
  inbound: number;
  outbound: number;
  order_kirim: number;
  vendor: number;
  completed: number;
}

export class FleetDashboardTotalSummaryDto {
  order_jemput: number;
  inbound: number;
  outbound: number;
  order_kirim: number;
  vendor: number;
  completed: number;
  total: number; // Jumlah semua status
}

export class FleetDashboardSummaryResponseDto {
  hubs: FleetDashboardHubSummaryDto[];
  total: FleetDashboardTotalSummaryDto;
}
