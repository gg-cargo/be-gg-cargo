import { IsString, IsOptional, MaxLength } from 'class-validator';

export class GenerateReferralCodeDto {
  @IsString()
  @IsOptional()
  @MaxLength(10, { message: 'Prefix maksimal 10 karakter' })
  prefix?: string;
}

