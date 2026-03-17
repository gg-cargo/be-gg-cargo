import { IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class FleetShipmentsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 20;

  /**
   * pickup | transit | out_for_delivery | delivered
   */
  @IsOptional()
  @IsString()
  status?: string;

  /**
   * Service ID mapping (lihat fleet_shipments_api.md)
   * 1 = Kirim Hemat, 2 = Kirim Motor, 3 = Regular, dst.
   */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  service_id?: number;

  /**
   * Filter langsung berdasarkan kolom orders.layanan
   * Contoh: "Kirim Hemat", "Reguler", "Express"
   */
  @IsOptional()
  @IsString()
  layanan?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  vendor_id?: number;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  delay_only?: boolean;

  @IsOptional()
  @IsString()
  search?: string;
}

export class FleetShipmentServiceDto {
  id: number | null;
  name: string;
}

export class FleetShipmentVendorDto {
  id: number | null;
  name: string;
}

export class FleetShipmentItemDto {
  resi: string;
  service: FleetShipmentServiceDto;
  vendor: FleetShipmentVendorDto;
  hub_source_id: number | null;
  hub_source_name: string | null;
  hub_dest_id: number | null;
  hub_dest_name: string | null;
  current_hub_id: number | null;
  current_hub_name: string | null;
  pickup_date: string | null;
  transit_time: number;
  latest_status: string | null;
  sla_days: number | null;
  sla_status: 'ON_TIME' | 'DELAY';
  last_update: string | null;
}

export class FleetShipmentsResponseDto {
  page: number;
  limit: number;
  total: number;
  data: FleetShipmentItemDto[];
}

