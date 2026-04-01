import { Controller, Get, Post, Body, UseGuards, Param, Delete, Patch } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserRole } from './user.entity';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import * as bcrypt from 'bcrypt';

@Controller('users')
@UseGuards(RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(UserRole.ADMIN)
  @Patch(':id') // <--- ROTA DE EDIÇÃO
  async update(@Param('id') id: string, @Body() body: any) {
    return this.usersService.update(id, {
      name: body.name,
      access_code: body.access_code,
      role: body.role,
      password: body.password, // O Service vai tratar se isso estiver vazio
    });
  }
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Roles(UserRole.ADMIN)
  @Post()
  async create(@Body() body: any) {
    // Verifica se a senha veio
    if (!body.password) {
        throw new Error("Senha é obrigatória");
    }

    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(body.password, salt);

    return this.usersService.create({
      name: body.name,
      access_code: body.access_code,
      password_hash: hash,
      role: body.role || UserRole.RESEARCHER,
    });
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}