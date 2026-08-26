import { Model } from '@nozbe/watermelondb'
import { field, readonly, date } from '@nozbe/watermelondb/decorators'

export default class Response extends Model {
  static table = 'responses'

  @field('survey_id') declare surveyId: string
  @field('location_id') declare locationId: string
  @field('latitude') declare latitude: number | undefined
  @field('longitude') declare longitude: number | undefined
  @field('data_payload') declare dataPayload: string
  @field('is_draft') declare isDraft: boolean
  @readonly @date('created_at') declare createdAt: Date
  @readonly @date('updated_at') declare updatedAt: Date
}