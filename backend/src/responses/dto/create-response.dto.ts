export class CreateResponseDto {
  survey_id: string;
  location_id: string;
  answers_json: any; // O JSON com as respostas do formulário
}