import { IsString, IsOptional, IsBoolean, IsNotEmpty } from 'class-validator';

export class CreateSurveyDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  // Aceita qualquer estrutura de JSON (array de perguntas)
  @IsOptional()
  questions_schema: any; 

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
