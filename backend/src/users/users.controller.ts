import { Controller, Get, Post, Body, UseGuards, Param, Delete, Patch } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserRole } from './user.entity';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import * as bcrypt from 'bcrypt';

@UseGuards(RolesGuard)
@Controller('users')
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
    const password_hash = await this.usersService.hashPassword(body.password);
    
    return this.usersService.create({
      name: body.name,
      access_code: body.access_code,
      password_hash,
      role: body.role || UserRole.RESEARCHER,
    });
  }

  @Post('setup-admin')
  async setupAdmin(@Body() body: any) {
    return await this.usersService.createAdminBypass(body);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}