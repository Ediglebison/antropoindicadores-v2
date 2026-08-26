import { Model } from '@nozbe/watermelondb'
import { text, readonly, date } from '@nozbe/watermelondb/decorators'

export default class Location extends Model {
  static table = 'locations'

  @text('name') declare name: string
  @text('unique_code') declare uniqueCode: string | undefined
  @text('city') declare city: string | undefined
  @text('state') declare state: string | undefined
  @text('description') declare description: string | undefined
  @readonly @date('created_at') declare createdAt: Date
  @readonly @date('updated_at') declare updatedAt: Date
}