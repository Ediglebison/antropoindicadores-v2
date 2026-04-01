import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('locations')
@UseGuards(RolesGuard)
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Roles(UserRole.ADMIN) // Apenas Admin cria
  @Post()
  create(@Body() body: any) {
    return this.locationsService.create(body);
  }

  @Roles(UserRole.ADMIN, UserRole.RESEARCHER) // Todos podem ver a lista
  @Get()
  findAll() {
    return this.locationsService.findAll();
  }

  @Roles(UserRole.ADMIN) // Apenas Admin edita
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.locationsService.update(id, body);
  }

  @Roles(UserRole.ADMIN) // Apenas Admin deleta
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.locationsService.remove(id);
  }
}