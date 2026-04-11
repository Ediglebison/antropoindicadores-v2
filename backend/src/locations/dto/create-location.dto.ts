import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateLocationDto {
  // --- Campos Obrigatórios Antigos ---
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  unique_code: string;

  // --- Novos Campos Opcionais ---
  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  description?: string;
}