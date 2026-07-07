import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

// Mock AuthGuard('jwt') prototype so super.canActivate returns true
jest.mock('@nestjs/passport', () => ({
  AuthGuard: () =>
    class {
      canActivate() {
        return true;
      }
    },
}));

describe('RolesGuard', () => {
  let reflector: Reflector;

  function mockContext(role?: string) {
    const user = role ? { userId: '1', username: 'test', role } : undefined;
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;
  }

  beforeEach(() => {
    reflector = new Reflector();
  });

  it('should be defined', () => {
    const guard = new RolesGuard(reflector);
    expect(guard).toBeDefined();
  });

  it('permite acesso quando não há metadata de roles (fallback)', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    const guard = new RolesGuard(reflector);
    const result = await guard.canActivate(mockContext('ADMIN'));
    expect(result).toBe(true);
  });

  it('bloqueia usuário sem role quando metadata existe', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);

    const guard = new RolesGuard(reflector);
    const result = await guard.canActivate(mockContext(undefined));
    expect(result).toBe(false);
  });

  it('permite ADMIN quando role está na lista de permitidas', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);

    const guard = new RolesGuard(reflector);
    const result = await guard.canActivate(mockContext('ADMIN'));
    expect(result).toBe(true);
  });

  it('bloqueia RESEARCHER quando apenas ADMIN é permitido', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);

    const guard = new RolesGuard(reflector);
    const result = await guard.canActivate(mockContext('RESEARCHER'));
    expect(result).toBe(false);
  });

  it('permite RESEARCHER quando ADMIN e RESEARCHER estão na lista', async () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['ADMIN', 'RESEARCHER']);

    const guard = new RolesGuard(reflector);
    const result = await guard.canActivate(mockContext('RESEARCHER'));
    expect(result).toBe(true);
  });
});
