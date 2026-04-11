import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Survey } from './entities/survey.entity';
import { CreateSurveyDto } from './dto/create-survey.dto';

@Injectable()
export class SurveysService {
  constructor(
    @InjectRepository(Survey)
    private surveysRepository: Repository<Survey>,
  ) {}

  // Cria um novo questionário
  async create(createSurveyDto: CreateSurveyDto): Promise<Survey> {
    const survey = this.surveysRepository.create(createSurveyDto);
    return this.surveysRepository.save(survey);
  }

  // Lista todos os questionários
  async findAll(): Promise<Survey[]> {
    return this.surveysRepository.find({
      order: { created_at: 'DESC' } // Mostra os mais recentes primeiro
    });
  }

  // Busca um específico pelo ID
  async findOne(id: string): Promise<Survey | null> {
    return this.surveysRepository.findOne({ where: { id } });
  }

  // Desativa/Ativa um questionário (Soft delete lógico)
  async toggleActive(id: string): Promise<void> {
    const survey = await this.findOne(id);
    if (survey) {
      survey.is_active = !survey.is_active;
      await this.surveysRepository.save(survey);
    }
  }

  // ==========================================
  // NOVOS MÉTODOS PARA O CRUD (EDITAR E EXCLUIR)
  // ==========================================

  // Atualiza um questionário existente (PUT)
  async update(id: string, updateSurveyDto: any) {
    // Encontra o questionário pelo ID e atualiza com os dados novos
    await this.surveysRepository.update(id, updateSurveyDto);
    // Retorna o questionário atualizado
    return this.surveysRepository.findOne({ where: { id } });
  }

  // Exclui um questionário definitivamente (DELETE)
  async remove(id: string): Promise<void> {
    // O comando delete do TypeORM remove a linha do banco de dados
    await this.surveysRepository.delete(id);
  }
}