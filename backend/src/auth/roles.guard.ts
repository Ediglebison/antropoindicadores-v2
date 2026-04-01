import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class RolesGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(private reflector: Reflector) {
    super();
  }

  // MUDANÇA 1: Adicionamos 'async' e 'Promise<boolean>'
  async canActivate(context: ExecutionContext): Promise<boolean> {
    
    // MUDANÇA 2: Verificamos se a rota exige alguma role específica
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    // Se a rota não exige roles, executamos apenas o AuthGuard padrão (validar token)
    if (!requiredRoles) {
      return super.canActivate(context) as Promise<boolean>;
    }

    // MUDANÇA 3: Usamos 'await' para esperar o AuthGuard validar o token primeiro
    const canActivate = await super.canActivate(context);
    
    if (!canActivate) {
      return false;
    }

    // MUDANÇA 4: Agora é seguro pegar o usuário
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Verificação de segurança: Se o user não existe ou não tem role, bloqueia
    if (!user || !user.role) {
      console.log("Bloqueio de Role: Usuário sem role definida no token/request");
      return false;
    }

    // Verifica se a role do usuário está na lista de permitidas
    return requiredRoles.includes(user.role);
  }
}