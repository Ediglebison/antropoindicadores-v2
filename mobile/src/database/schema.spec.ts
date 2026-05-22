import { mySchema } from './schema';

describe('Database Schema', () => {
  it('should define the correct version', () => {
    expect(mySchema.version).toBe(3);
  });

  it('should have tables defined', () => {
    const tableNames = Object.keys(mySchema.tables);
    expect(tableNames).toContain('surveys');
    expect(tableNames).toContain('locations');
    expect(tableNames).toContain('responses');
    expect(tableNames).toContain('users');
  });
});
