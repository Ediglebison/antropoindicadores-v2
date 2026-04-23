import { Controller, Get, Post, Body, UseGuards, Param, Delete, Patch, Headers, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserRole } from './user.entity';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@UseGuards(RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(UserRole.ADMIN)
  @Patch(':id') // <--- ROTA DE EDIÇÃO
  async update(@Param('id') id: string, @Body() body: UpdateUserDto) {
    return this.usersService.update(id, {
      name: body.name,
      access_code: body.access_code,
      role: body.role,
      password: body.password, // O Service vai tratar se isso estiver vazio
    });
  }

  @Roles(UserRole.ADMIN)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Roles(UserRole.ADMIN)
  @Post()
  async create(@Body() body: CreateUserDto) {
    const password_hash = await this.usersService.hashPassword(body.password);
    
    return this.usersService.create({
      name: body.name,
      access_code: body.access_code,
      password_hash,
      role: body.role || UserRole.RESEARCHER,
    });
  }

  @Post('setup-admin')
  async setupAdmin(@Body() body: CreateUserDto, @Headers('x-setup-token') setupToken: string) {
    if (!process.env.SETUP_TOKEN || setupToken !== process.env.SETUP_TOKEN) {
      throw new UnauthorizedException('Token de setup inválido ou ausente.');
    }
    return await this.usersService.createAdminBypass(body);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
