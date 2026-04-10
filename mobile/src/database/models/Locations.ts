import { Model } from '@nozbe/watermelondb'
import { field, readonly, date } from '@nozbe/watermelondb/decorators'

export default class Location extends Model {
  // Conecta este modelo à tabela 'locations' do schema
  static table = 'locations'

  @field('name') 
  name!: string

  @readonly @date('created_at') 
  createdAt!: Date

  @readonly @date('updated_at') 
  updatedAt!: Date
}