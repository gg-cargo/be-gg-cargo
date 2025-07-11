import { IsEmail, IsNotEmpty, IsString, IsOptional, IsNumber, MinLength } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsNumber()
  level?: number;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  nik?: string;

  @IsOptional()
  @IsString()
  sim?: string;

  @IsOptional()
  @IsString()
  stnk?: string;

  @IsOptional()
  @IsString()
  kir?: string;

  @IsOptional()
  @IsString()
  expired_sim?: string;

  @IsOptional()
  @IsString()
  expired_stnk?: string;

  @IsOptional()
  @IsString()
  expired_kir?: string;

  @IsOptional()
  @IsNumber()
  jenis_mobil?: number;

  @IsOptional()
  @IsString()
  no_polisi?: string;

  @IsOptional()
  @IsString()
  type_transporter?: string;
} 