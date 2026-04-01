import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService
  ) {}

  @Post('login')
  async login(@Body() body) {
    const user = await this.authService.validateUser(body.access_code, body.password);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    return this.authService.login(user);
  }

  // Rota auxiliar para criar o primeiro Admin com senha criptografada
  @Post('register')
  async register(@Body() body) {
    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(body.password, salt);

    return this.usersService.create({
      name: body.name,
      access_code: body.access_code,
      password_hash: hash, // Salva o hash, não a senha!
    });
  }
}