import { Model } from '@nozbe/watermelondb'
import { field, readonly, date } from '@nozbe/watermelondb/decorators'

export default class Response extends Model {
  static table = 'responses'

  @field('survey_id') 
  surveyId!: string

  @field('location_id') 
  locationId!: string

  // O WatermelonDB não tem tipo "JSON", então salvamos como string (texto)
  // Na hora de usar na tela, a gente faz um JSON.parse()
  @field('data_payload') 
  dataPayload!: string

  @readonly @date('created_at') 
  createdAt!: Date

  @readonly @date('updated_at') 
  updatedAt!: Date
}