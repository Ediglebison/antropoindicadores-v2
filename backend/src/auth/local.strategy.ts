import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      // 👉 A MÁGICA ESTÁ AQUI: Avisamos o Passport que o "username" agora se chama "access_code"
      usernameField: 'access_code', 
      passwordField: 'password',
    });
  }

  async validate(access_code: string, pass: string): Promise<any> {
    const user = await this.authService.validateUser(access_code, pass);
    if (!user) {
      throw new UnauthorizedException('Acesso negado. Verifique suas credenciais.');
    }
    return user;
  }
}