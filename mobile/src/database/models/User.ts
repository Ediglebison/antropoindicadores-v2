import { Model } from '@nozbe/watermelondb'
import { text, readonly, date } from '@nozbe/watermelondb/decorators'

export default class User extends Model {
  static table = 'users'

  @text('name') declare name: string
  @text('access_code') declare accessCode: string
  @text('password_hash') declare passwordHash: string
  @text('role') declare role: string
  @readonly @date('created_at') declare createdAt: Date
  @readonly @date('updated_at') declare updatedAt: Date
}
