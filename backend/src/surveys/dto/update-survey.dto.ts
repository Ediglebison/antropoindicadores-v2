import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateSurveyDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  questions_schema?: any;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
