import { IsString, IsObject, IsOptional } from 'class-validator';

export class UpdateDraftDto {
  @IsString()
  @IsOptional()
  location_id?: string;

  @IsObject()
  @IsOptional()
  data_payload?: Record<string, unknown>;
}
