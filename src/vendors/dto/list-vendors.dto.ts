import { IsOptional, IsString, IsNumber, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class ListVendorsQueryDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber({}, { message: 'Page harus berupa angka' })
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber({}, { message: 'Limit harus berupa angka' })
  limit?: number = 20;

  @IsOptional()
  @IsString({ message: 'Search harus berupa string' })
  search?: string;

  @IsOptional()
  @IsString()
  @IsIn(['Aktif', 'Nonaktif', 'Dalam Proses'], {
    message: 'Status vendor harus: Aktif, Nonaktif, atau Dalam Proses',
  })
  status_vendor?: string;

  @IsOptional()
  @IsString()
  @IsIn(['FTL', 'LTL', 'Kurir', 'Internasional'], {
    message: 'Jenis layanan harus: FTL, LTL, Kurir, atau Internasional',
  })
  jenis_layanan?: string;
}

export class VendorListItemDto {
  no: number;
  kode: string;
  nama: string;
  pic: string;
  telepon: string;
  layanan: string;
  status: string;
}

export class PaginationDto {
  current_page: number;
  limit: number;
  total_items: number;
  total_pages: number;
}

export class ListVendorsResponseDto {
  message: string;
  data: {
    pagination: PaginationDto;
    vendors: VendorListItemDto[];
  };
}

