import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ReweightCorrectionActionType {
  ADD = 'ADD',
  UPDATE = 'UPDATE',
  REMOVE = 'REMOVE',
}

export class EditReweightActionV2Dto {
  @IsEnum(ReweightCorrectionActionType, { message: 'Action harus ADD, UPDATE, atau REMOVE' })
  action: ReweightCorrectionActionType;

  @ValidateIf((o) => o.action !== ReweightCorrectionActionType.ADD)
  @IsNumber({}, { message: 'Piece ID harus berupa angka' })
  piece_id?: number;

  @ValidateIf((o) => o.action !== ReweightCorrectionActionType.REMOVE)
  @IsNumber({}, { message: 'Berat harus berupa angka' })
  berat?: number;

  @ValidateIf((o) => o.action !== ReweightCorrectionActionType.REMOVE)
  @IsNumber({}, { message: 'Panjang harus berupa angka' })
  panjang?: number;

  @ValidateIf((o) => o.action !== ReweightCorrectionActionType.REMOVE)
  @IsNumber({}, { message: 'Lebar harus berupa angka' })
  lebar?: number;

  @ValidateIf((o) => o.action !== ReweightCorrectionActionType.REMOVE)
  @IsNumber({}, { message: 'Tinggi harus berupa angka' })
  tinggi?: number;
}

export class EditReweightRequestV2Dto {
  @IsArray({ message: 'Actions harus berupa array' })
  @ArrayMinSize(1, { message: 'Minimal satu action harus diajukan' })
  @ValidateNested({ each: true })
  @Type(() => EditReweightActionV2Dto)
  actions: EditReweightActionV2Dto[];

  @IsOptional()
  @IsString({ message: 'Note harus berupa string' })
  @MaxLength(35, { message: 'Note maksimal 35 karakter' })
  note?: string;

  @IsOptional()
  @IsString({ message: 'Alasan koreksi harus berupa string' })
  alasan_koreksi?: string;
}

export class EditReweightRequestV2ResponseDto {
  message: string;
  success: boolean;
  data: {
    order_id: number;
    batch_id: string;
    requested_by: string;
    requested_at: string;
    note: string;
    status: string;
    estimated_approval_time: string | null;
    requests: Array<{
      request_id: number;
      action: ReweightCorrectionActionType;
      piece_id: number | null;
      current_data: { berat: number; panjang: number; lebar: number; tinggi: number } | null;
      new_data: { berat: number; panjang: number; lebar: number; tinggi: number } | null;
    }>;
  };
}
