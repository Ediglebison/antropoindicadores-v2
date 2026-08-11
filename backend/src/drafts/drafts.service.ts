import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Draft } from './entities/draft.entity';
import { CreateDraftDto } from './dto/create-draft.dto';
import { UpdateDraftDto } from './dto/update-draft.dto';
import { Response } from '../responses/entities/response.entity';
import { ResponsesService } from '../responses/responses.service';

@Injectable()
export class DraftsService {
  constructor(
    @InjectRepository(Draft)
    private draftsRepository: Repository<Draft>,
    private readonly responsesService: ResponsesService,
  ) {}

  async create(
    createDraftDto: CreateDraftDto,
    researcherId: string,
  ): Promise<Draft> {
    const newDraft = this.draftsRepository.create({
      id: Date.now().toString(), // Gera ID com timestamp
      data_payload: createDraftDto.data_payload,
      survey_id: createDraftDto.survey_id,
      location_id: createDraftDto.location_id,
      researcher_id: researcherId,
    });

    return await this.draftsRepository.save(newDraft);
  }

  async findAllForResearcher(researcherId: string): Promise<Draft[]> {
    return this.draftsRepository.find({
      where: { researcher_id: researcherId },
      relations: ['survey', 'location'],
      order: { created_at: 'DESC' },
    });
  }

  async findOneForResearcher(id: string, researcherId: string): Promise<Draft> {
    const draft = await this.draftsRepository.findOne({
      where: { id, researcher_id: researcherId },
    });

    if (!draft) {
      throw new NotFoundException(`Rascunho ${id} não encontrado`);
    }

    return draft;
  }

  async update(
    id: string,
    researcherId: string,
    updateDraftDto: UpdateDraftDto,
  ): Promise<Draft> {
    await this.draftsRepository.update(
      { id, researcher_id: researcherId },
      updateDraftDto,
    );
    return this.findOneForResearcher(id, researcherId);
  }

  async remove(id: string, researcherId: string): Promise<void> {
    await this.draftsRepository.delete({ id, researcher_id: researcherId });
  }

  async finalize(id: string, researcherId: string): Promise<Response> {
    const draft = await this.findOneForResearcher(id, researcherId);
    const response = await this.responsesService.create(
      {
        survey_id: draft.survey_id,
        location_id: draft.location_id,
        answers_json: draft.data_payload,
      },
      researcherId,
    );
    await this.remove(id, researcherId);
    return response;
  }
}
