import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { Response } from 'express';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(
    access_code: string,
    pass: string,
  ): Promise<Partial<User> | null> {
    const user = await this.usersService.findOneByCode(access_code);

    if (user && (await bcrypt.compare(pass, user.password_hash))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password_hash, ...result } = user;
      return result;
    }
    return null;
  }

  login(user: User | Partial<User>, res: Response) {
    const payload = {
      username: user.access_code,
      sub: user.id,
      role: user.role,
    };
    const token = this.jwtService.sign(payload);

    res.cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        access_code: user.access_code,
        role: user.role,
      },
    };
  }
}
