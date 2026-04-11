// src/database/models/Survey.ts
import { Model } from '@nozbe/watermelondb'
import { text, field, date, readonly } from '@nozbe/watermelondb/decorators'

export default class Survey extends Model {
  // Conecta esta classe à tabela 'surveys' do schema
  static table = 'surveys'

  // Mapeia as colunas usando os Decorators (por isso ativamos no Babel!)
  @text('title') title!: string
  @text('description') description?: string
  @text('questions_schema') questionsSchema?: string
  @field('is_active') isActive!: boolean
  
  // O WatermelonDB preenche essas datas automaticamente
  @readonly @date('created_at') createdAt!: Date
  @readonly @date('updated_at') updatedAt!: Date
}