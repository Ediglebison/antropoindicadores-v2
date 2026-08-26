// src/database/models/Survey.ts
import { Model } from '@nozbe/watermelondb'
import { text, field, date, readonly } from '@nozbe/watermelondb/decorators'

export default class Survey extends Model {
  static table = 'surveys'

  @text('title') declare title: string
  @text('description') declare description: string | undefined
  @text('questions_schema') declare questionsSchema: string | undefined
  @field('is_active') declare isActive: boolean
  
  @readonly @date('created_at') declare createdAt: Date
  @readonly @date('updated_at') declare updatedAt: Date
}