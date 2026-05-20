export class UserSaldoResponseDto {
  success: boolean;
  message: string;
  data: {
    user_id: number;
    user_name: string;
    freeze_saldo: string;
    saldo_id: number | null;
    saldo: number;
    saldo_dibekukan: number;
    saldo_aktif: number;
    kode_referral: string | null;
    updated_at: Date | null;
  };
}
