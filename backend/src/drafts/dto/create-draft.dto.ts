import { IsString, IsNotEmpty, IsObject, IsOptional } from 'class-validator';

export class CreateDraftDto {
  @IsString()
  @IsNotEmpty()
  survey_id: string;

  @IsString()
  @IsOptional()
  location_id?: string;

  @IsObject()
  @IsNotEmpty()
  data_payload: Record<string, unknown>;
}
