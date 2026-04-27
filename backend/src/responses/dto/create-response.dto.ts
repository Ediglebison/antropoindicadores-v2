import { IsString, IsNotEmpty, IsObject, IsOptional } from 'class-validator';

export class CreateResponseDto {
  @IsString()
  @IsNotEmpty()
  survey_id: string;

  @IsString()
  @IsOptional()
  location_id: string;

  @IsObject()
  @IsNotEmpty()
  answers_json: any; // O JSON com as respostas do formulário
}