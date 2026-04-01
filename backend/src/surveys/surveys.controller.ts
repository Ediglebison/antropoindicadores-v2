import { Controller, Get, Post, Put, Delete, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { SurveysService } from './surveys.service';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { AuthGuard } from '@nestjs/passport'; 

@Controller('surveys')
export class SurveysController {
  constructor(private readonly surveysService: SurveysService) {}

  // ROTA: POST http://localhost:3000/surveys
  @UseGuards(AuthGuard('jwt')) 
  @Post()
  create(@Body() createSurveyDto: CreateSurveyDto) {
    return this.surveysService.create(createSurveyDto);
  }

  // ROTA: GET http://localhost:3000/surveys
  @UseGuards(AuthGuard('jwt'))
  @Get()
  findAll() {
    return this.surveysService.findAll();
  }

  // ROTA: GET http://localhost:3000/surveys/:id
  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.surveysService.findOne(id);
  }

  // ROTA: PUT http://localhost:3000/surveys/:id
  @UseGuards(AuthGuard('jwt'))
  @Put(':id')
  update(@Param('id') id: string, @Body() updateData: CreateSurveyDto) {
    return this.surveysService.update(id, updateData);
  }

  // ROTA: DELETE http://localhost:3000/surveys/:id
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.surveysService.remove(id);
  }

  // ROTA: PATCH http://localhost:3000/surveys/:id/toggle
  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/toggle')
  toggleActive(@Param('id') id: string) {
    return this.surveysService.toggleActive(id);
  }
}