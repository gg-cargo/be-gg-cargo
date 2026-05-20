import { Type } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

/** Opsional: override driver untuk trip vendor (atau jika belum tersimpan di assignment). */
export class CreditFleetDepositSaldoDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'driver_1_user_id harus angka' })
  driver_1_user_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'driver_2_user_id harus angka' })
  driver_2_user_id?: number;
}
