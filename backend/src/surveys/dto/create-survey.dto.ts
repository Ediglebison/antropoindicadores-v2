export class CreateSurveyDto {
  title: string;
  description?: string;
  // Aceita qualquer estrutura de JSON (array de perguntas)
  questions_schema: any; 
  is_active?: boolean;
}