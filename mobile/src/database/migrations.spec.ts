import { myMigrations } from './migrations';

describe('Database Migrations', () => {
  it('should be a valid migration targeting version 5', () => {
    expect(myMigrations.validated).toBe(true);
    expect(myMigrations.minVersion).toBe(4);
    expect(myMigrations.maxVersion).toBe(5);
  });

  it('should add the is_draft column to responses via addColumns', () => {
    const migration = myMigrations.sortedMigrations.find((entry) => entry.toVersion === 5);

    expect(migration).toBeDefined();
    expect(migration?.steps).toHaveLength(1);

    const step = migration?.steps[0];
    expect(step?.type).toBe('add_columns');

    if (step?.type === 'add_columns') {
      expect(step.table).toBe('responses');
      expect(step.columns).toContainEqual(
        expect.objectContaining({ name: 'is_draft', type: 'boolean', isOptional: true }),
      );
    }
  });
});