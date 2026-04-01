import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  // Passo 1: Valida se o usuário existe e a senha bate
  async validateUser(access_code: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByCode(access_code);
    
    if (user && await bcrypt.compare(pass, user.password_hash)) {
      // Remove a senha do objeto de retorno por segurança
      const { password_hash, ...result } = user;
      return result;
    }
    return null;
  }

  // Passo 2: Gera o Token JWT
  async login(user: any) {
    const payload = { 
      username: user.access_code, 
      sub: user.id, 
      role: user.role
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        access_code: user.access_code,
        role: user.role
      }
    };
  }
}