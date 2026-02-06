import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateTariffStatusDto {
    @IsBoolean()
    @IsNotEmpty()
    is_active: boolean;
}
