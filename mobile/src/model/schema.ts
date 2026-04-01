import { appSchema, tableSchema } from '@nozbe/watermelondb'

export const mySchema = appSchema({
  version: 1, // Sempre que mudar o banco local, incremente este número
  tables: [
    // Tabela de Usuários (Pesquisadores)
    tableSchema({
      name: 'users',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'access_code', type: 'string', isIndexed: true }, // Indexado para busca rápida no login
        { name: 'password_hash', type: 'string' },
      ],
    }),

    // Tabela de Locais
    tableSchema({
      name: 'locations',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'unique_code', type: 'string', isIndexed: true },
        { name: 'address', type: 'string', isOptional: true },
        { name: 'latitude', type: 'number', isOptional: true },
        { name: 'longitude', type: 'number', isOptional: true },
      ],
    }),

    // Tabela de Questionários (Surveys)
    tableSchema({
      name: 'surveys',
      columns: [
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'questions_schema', type: 'string' }, // No SQLite do celular, salvamos JSON como string
        { name: 'is_active', type: 'boolean' },
      ],
    }),

    // Tabela de Respostas (Responses) - Onde a mágica do offline acontece
    tableSchema({
      name: 'responses',
      columns: [
        { name: 'data_payload', type: 'string' }, // JSON com as respostas
        { name: 'collected_at', type: 'number' }, // Datas no WatermelonDB geralmente são timestamps (números)
        { name: 'researcher_id', type: 'string', isIndexed: true }, // Relação com User
        { name: 'location_id', type: 'string', isIndexed: true },   // Relação com Location
        { name: 'survey_id', type: 'string', isIndexed: true },     // Relação com Survey
        // Campos de controle de sincronização (criados automaticamente pelo WatermelonDB, mas bom saber)
        // _status, _changed
      ],
    }),
  ],
})