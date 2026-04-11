import { Model } from '@nozbe/watermelondb'
import { field, text, readonly, date } from '@nozbe/watermelondb/decorators'

export default class Location extends Model {
  // Conecta este modelo à tabela 'locations' do schema
  static table = 'locations'

  @text('name') 
  name!: string

  @text('unique_code')
  uniqueCode?: string

  @text('city')
  city?: string

  @text('state')
  state?: string

  @text('description')
  description?: string

  @readonly @date('created_at') 
  createdAt!: Date

  @readonly @date('updated_at') 
  updatedAt!: Date
}