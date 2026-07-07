import {
  IsString,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsNumber,
} from 'class-validator';

export class CreateResponseDto {
  @IsString()
  @IsNotEmpty()
  survey_id: string;

  @IsString()
  @IsOptional()
  location_id: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsObject()
  @IsNotEmpty()
  answers_json: any; // O JSON com as respostas do formulário
}
