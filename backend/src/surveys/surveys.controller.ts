import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { SurveysService } from './surveys.service';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { UpdateSurveyDto } from './dto/update-survey.dto';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';

@UseGuards(RolesGuard)
@Controller('surveys')
export class SurveysController {
  constructor(private readonly surveysService: SurveysService) {}

  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() createSurveyDto: CreateSurveyDto) {
    return this.surveysService.create(createSurveyDto);
  }

  @Roles(UserRole.ADMIN, UserRole.RESEARCHER)
  @Get()
  findAll() {
    return this.surveysService.findAll();
  }

  @Roles(UserRole.ADMIN, UserRole.RESEARCHER)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.surveysService.findOne(id);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSurveyDto: UpdateSurveyDto) {
    return this.surveysService.update(id, updateSurveyDto);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.surveysService.remove(id);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id/toggle')
  toggleActive(@Param('id') id: string) {
    return this.surveysService.toggleActive(id);
  }
}
