import { Type } from 'class-transformer';
import { IsIn, IsNumber } from 'class-validator';

export class UpdateDriverStatusAppDto {
    @Type(() => Number)
    @IsNumber({}, { message: 'status_app harus angka' })
    @IsIn([0, 1], { message: 'status_app harus 0 (tutup) atau 1 (buka)' })
    status_app: 0 | 1;
}
