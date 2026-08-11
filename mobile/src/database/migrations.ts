import { addColumns, schemaMigrations } from '@nozbe/watermelondb/Schema/migrations'

export const myMigrations = schemaMigrations({
  migrations: [
    {
      toVersion: 5,
      steps: [
        addColumns({
          table: 'responses',
          columns: [
            { name: 'is_draft', type: 'boolean', isOptional: true },
          ],
        }),
      ],
    },
  ],
})