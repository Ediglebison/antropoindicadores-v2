import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/auth.dto';
import { RolesGuard } from './roles.guard';
import type { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Throttle({ login: { limit: 5, ttl: 60000 } })
  @Post('login')
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.validateUser(
      body.access_code,
      body.password,
    );
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    return this.authService.login(user, res);
  }

  @UseGuards(RolesGuard)
  @Get('me')
  async me(@Req() req: Request) {
    const user = await this.authService.findMe((req.user as any)?.userId);
    if (!user) throw new UnauthorizedException('Usuário não encontrado');
    return {
      id: user.id,
      name: user.name,
      access_code: user.access_code,
      role: user.role,
    };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', { path: '/' });
    return { message: 'Sessão encerrada' };
  }
}
