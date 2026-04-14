import { Model } from '@nozbe/watermelondb'
import { field, text, readonly, date } from '@nozbe/watermelondb/decorators'

export default class User extends Model {
  // Conecta este modelo à tabela 'users' do schema
  static table = 'users'

  @text('name') 
  name!: string

  @text('access_code')
  accessCode!: string

  @text('password_hash')
  passwordHash!: string

  @text('role')
  role!: string

  @readonly @date('created_at') 
  createdAt!: Date

  @readonly @date('updated_at') 
  updatedAt!: Date
}
