import { Controller, Get, Post, Body, Patch, Put, Param, Delete, UseGuards } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('locations')
@UseGuards(RolesGuard)
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() body: any) {
    return this.locationsService.create(body);
  }

  @Roles(UserRole.ADMIN, UserRole.RESEARCHER)
  @Get()
  findAll() {
    return this.locationsService.findAll();
  }

  @Roles(UserRole.ADMIN)
  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.locationsService.update(id, body);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id')
  patch(@Param('id') id: string, @Body() body: any) {
    return this.locationsService.update(id, body);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.locationsService.remove(id);
  }
}