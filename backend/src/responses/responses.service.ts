import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Response } from './response.entity';
import { CreateResponseDto } from './dto/create-response.dto';

@Injectable()
export class ResponsesService {
  constructor(
    @InjectRepository(Response)
    private responsesRepository: Repository<Response>,
  ) {}

  async create(createResponseDto: CreateResponseDto, researcherId: string): Promise<Response> {
    // Aqui fazemos a correspondência entre o que vem do Front e as colunas reais do Banco
    const newResponse = this.responsesRepository.create({
      data_payload: createResponseDto.answers_json, // O front manda 'answers_json', o banco salva como 'data_payload'
      survey: { id: createResponseDto.survey_id },
      location: { id: createResponseDto.location_id },
      researcher: { id: researcherId }
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