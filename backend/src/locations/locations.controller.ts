import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { LocationsService } from './locations.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

@Controller('locations')
@UseGuards(RolesGuard)
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() createLocationDto: CreateLocationDto) {
    return this.locationsService.create(createLocationDto);
  }

  @Roles(UserRole.ADMIN, UserRole.RESEARCHER)
  @Get()
  findAll() {
    return this.locationsService.findAll();
  }

  @Roles(UserRole.ADMIN)
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateLocationDto: UpdateLocationDto,
  ) {
    return this.locationsService.update(id, updateLocationDto);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id')
  patch(
    @Param('id') id: string,
    @Body() updateLocationDto: UpdateLocationDto,
  ) {
    return this.locationsService.update(id, updateLocationDto);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.locationsService.remove(id);
  }
}
