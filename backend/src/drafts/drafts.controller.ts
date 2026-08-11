import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { DraftsService } from './drafts.service';
import { CreateDraftDto } from './dto/create-draft.dto';
import { UpdateDraftDto } from './dto/update-draft.dto';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';

@UseGuards(RolesGuard)
@Controller('drafts')
export class DraftsController {
  constructor(private readonly draftsService: DraftsService) {}

  @Roles(UserRole.RESEARCHER, UserRole.ADMIN)
  @Post()
  create(@Body() createDraftDto: CreateDraftDto, @Request() req) {
    // O req.user é preenchido automaticamente pelo seu jwt.strategy.ts
    const researcherId = req.user.userId;

    return this.draftsService.create(createDraftDto, researcherId);
  }

  @Roles(UserRole.RESEARCHER, UserRole.ADMIN)
  @Get()
  findAll(@Request() req) {
    const researcherId = req.user.userId;

    return this.draftsService.findAllForResearcher(researcherId);
  }

  @Roles(UserRole.RESEARCHER, UserRole.ADMIN)
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    const researcherId = req.user.userId;

    return this.draftsService.findOneForResearcher(id, researcherId);
  }

  @Roles(UserRole.RESEARCHER, UserRole.ADMIN)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDraftDto: UpdateDraftDto,
    @Request() req,
  ) {
    const researcherId = req.user.userId;

    return this.draftsService.update(id, researcherId, updateDraftDto);
  }

  @Roles(UserRole.RESEARCHER, UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    const researcherId = req.user.userId;

    return this.draftsService.remove(id, researcherId);
  }

  @Roles(UserRole.RESEARCHER, UserRole.ADMIN)
  @Post(':id/finalize')
  finalize(@Param('id') id: string, @Request() req) {
    const researcherId = req.user.userId;

    return this.draftsService.finalize(id, researcherId);
  }
}
