import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Response } from './entities/response.entity';
import { CreateResponseDto } from './dto/create-response.dto';

@Injectable()
export class ResponsesService {
  constructor(
    @InjectRepository(Response)
    private responsesRepository: Repository<Response>,
  ) {}

  async create(createResponseDto: CreateResponseDto, researcherId: string): Promise<Response> {
    const newResponse = this.responsesRepository.create({
      id: Date.now().toString(), // Gera ID com timestamp
      data_payload: createResponseDto.answers_json,
      survey_id: createResponseDto.survey_id,
      location_id: createResponseDto.location_id,
      researcher_id: researcherId
    });
    
    return await this.responsesRepository.save(newResponse);
  }

  async findAll(): Promise<Response[]> {
    return this.responsesRepository.find({
      relations: ['survey', 'location', 'researcher'], 
      order: { collected_at: 'DESC' } // A sua coluna de data se chama 'collected_at'
    });
  }
}