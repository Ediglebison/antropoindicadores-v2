import { appSchema, tableSchema } from '@nozbe/watermelondb'

export const mySchema = appSchema({
  version: 3, // Incremented version to force database recreation with users table
  tables: [
    // TABELA 1: Os Questionários (Templates)
    tableSchema({
      name: 'surveys',
      columns: [
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'questions_schema', type: 'string', isOptional: true }, 
        { name: 'is_active', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ]
    }),

    // TABELA 2: As Localidades
    tableSchema({
      name: 'locations',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'unique_code', type: 'string', isOptional: true },
        { name: 'city', type: 'string', isOptional: true },
        { name: 'state', type: 'string', isOptional: true },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ]
    }),

    // TABELA 3: As Respostas (A Coleta Real feita em campo)
    tableSchema({
      name: 'responses',
      columns: [
        { name: 'survey_id', type: 'string', isIndexed: true },
        { name: 'location_id', type: 'string', isIndexed: true },
        { name: 'data_payload', type: 'string' }, 
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ]
    }),

    // TABELA 4: Os Usuários (Para login offline)
    tableSchema({
      name: 'users',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'access_code', type: 'string' },
        { name: 'password_hash', type: 'string' },
        { name: 'role', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ]
    }),
  ]
})