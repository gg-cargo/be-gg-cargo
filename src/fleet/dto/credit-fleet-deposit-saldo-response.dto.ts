export class FleetDepositSaldoCreditItemDto {
  driver_slot: 1 | 2;
  user_id: number;
  user_name: string;
  deposit_amount: number;
  saldo_before: number;
  saldo_after: number;
}

export class CreditFleetDepositSaldoResponseDto {
  success: boolean;
  message: string;
  data: {
    fleet_trip_id: number;
    tracking_no: string;
    deposit_saldo_credited_at: Date;
    credits: FleetDepositSaldoCreditItemDto[];
  };
}
