import { mySchema } from './schema';

describe('Database Schema', () => {
  it('should define the correct version', () => {
    expect(mySchema.version).toBe(5);
  });

  it('should define the is_draft column on responses', () => {
    const responsesTable = mySchema.tables.responses;
    expect(responsesTable.columns.is_draft).toEqual(
      expect.objectContaining({ name: 'is_draft', type: 'boolean', isOptional: true }),
    );
  });

  it('should have tables defined', () => {
    const tableNames = Object.keys(mySchema.tables);
    expect(tableNames).toContain('surveys');
    expect(tableNames).toContain('locations');
    expect(tableNames).toContain('responses');
    expect(tableNames).toContain('users');
  });
});
