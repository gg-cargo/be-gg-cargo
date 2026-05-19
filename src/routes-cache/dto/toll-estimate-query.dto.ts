import { IsNotEmpty, Matches } from 'class-validator';

/** Format koordinat: lat,lng */
const LAT_LNG_REGEX = /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/;

export class TollEstimateQueryDto {
  @IsNotEmpty({ message: 'origin_latlng wajib diisi' })
  @Matches(LAT_LNG_REGEX, {
    message: 'Format origin_latlng tidak valid. Gunakan lat,lng (contoh: -6.2088,106.8456)',
  })
  origin_latlng: string;

  @IsNotEmpty({ message: 'destination_latlng wajib diisi' })
  @Matches(LAT_LNG_REGEX, {
    message: 'Format destination_latlng tidak valid. Gunakan lat,lng (contoh: -6.9175,107.6191)',
  })
  destination_latlng: string;
}
