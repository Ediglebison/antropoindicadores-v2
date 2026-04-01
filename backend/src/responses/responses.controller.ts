import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { ResponsesService } from './responses.service';
import { CreateResponseDto } from './dto/create-response.dto';
import { RolesGuard } from '../auth/roles.guard';

@Controller('responses')
@UseGuards(RolesGuard) // Exige que o usuário esteja logado (qualquer perfil)
export class ResponsesController {
  constructor(private readonly responsesService: ResponsesService) {}

  @Post()
  create(@Body() createResponseDto: CreateResponseDto, @Request() req) {
    // O req.user é preenchido automaticamente pelo seu jwt.strategy.ts
    const researcherId = req.user.userId; 
    
    return this.responsesService.create(createResponseDto, researcherId);
  }

  @Get()
  findAll() {
    return this.responsesService.findAll();
  }
}