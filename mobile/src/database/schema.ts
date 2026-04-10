import { appSchema, tableSchema } from '@nozbe/watermelondb'

export const mySchema = appSchema({
  version: 1,
  tables: [
    // TABELA 1: Os Questionários (Templates)
    tableSchema({
      name: 'surveys',
      columns: [
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        // O JSON do formulário precisa ser salvo como string no SQLite
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
        // Adicione outras colunas de location que você tiver no backend (ex: latitude, longitude)
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
        // Aqui vai o JSON com as respostas que o usuário digitou
        { name: 'data_payload', type: 'string' }, 
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ]
    }),
  ]
})