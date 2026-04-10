import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';

// 👇 1. OS IMPORTS FALTANTES ESTÃO AQUI!
import { Survey } from '../surveys/entities/survey.entity';
import { Location } from '../locations/entities/location.entity';
import { Response } from '../responses/entities/response.entity';

@Injectable()
export class SyncService {
  constructor(
    @InjectRepository(Survey)
    private surveyRepository: Repository<Survey>,
    
    @InjectRepository(Location)
    private locationRepository: Repository<Location>,
    
    @InjectRepository(Response)
    private responseRepository: Repository<Response>,
  ) {}

  // ==========================================
  // PULL: O SERVIDOR ENVIA QUESTIONÁRIOS E LOCAIS
  // ==========================================
  async pullChanges(lastPulledAt: number) {
    const lastPullDate = new Date(lastPulledAt);

    // 1. Prepara os Questionários (Surveys)
    const surveysAlterados = await this.surveyRepository.find({
      where: { updated_at: MoreThan(lastPullDate) },
    });
    const surveysCreated: any[] = [];
    const surveysUpdated: any[] = [];
    
    surveysAlterados.forEach(survey => {
      if (survey.created_at.getTime() > lastPulledAt) {
        surveysCreated.push(survey);
      } else {
        surveysUpdated.push(survey);
      }
    });

    // 2. Prepara as Localidades (Locations)
    const locationsAlterados = await this.locationRepository.find({
      where: { updated_at: MoreThan(lastPullDate) },
    });
    const locationsCreated: any[] = [];
    const locationsUpdated: any[] = [];
    
    locationsAlterados.forEach(location => {
      if (location.created_at.getTime() > lastPulledAt) {
        locationsCreated.push(location);
      } else {
        locationsUpdated.push(location);
      }
    });

    // Retorna o pacotão completo para o celular
    return {
      changes: {
        surveys: {
          created: surveysCreated,
          updated: surveysUpdated,
          deleted: [],
        },
        locations: {
          created: locationsCreated,
          updated: locationsUpdated,
          deleted: [],
        },
        // O celular vai baixar pesquisas e locais, mas não precisa baixar as respostas dos outros
        responses: { created: [], updated: [], deleted: [] }
      },
      timestamp: Date.now(),
    };
  }

  // ==========================================
  // PUSH: O SERVIDOR RECEBE AS RESPOSTAS DO CAMPO
  // ==========================================
  async pushChanges(changes: any, lastPulledAt: number) {
    // Pegamos apenas a "caixa" de respostas enviada pelo celular
    const responsesChanges = changes.responses;

    if (responsesChanges) {
      
      // Função para traduzir as datas do formato numérico do celular para o Banco de Dados
      const formatarResposta = (resp: any) => {
        return {
          ...resp,
          created_at: new Date(resp.created_at),
          updated_at: new Date(resp.updated_at),
        };
      };

      // A. Salva as novas coletas (criadas no mato)
      if (responsesChanges.created.length > 0) {
        const novasRespostas = responsesChanges.created.map(formatarResposta);
        await this.responseRepository.save(novasRespostas);
      }

      // B. Atualiza as coletas editadas (se o app permitir edição offline)
      if (responsesChanges.updated.length > 0) {
        const editadas = responsesChanges.updated.map(formatarResposta);
        for (const resp of editadas) {
          await this.responseRepository.update(resp.id, resp);
        }
      }

      // C. Deleta as excluídas offline
      if (responsesChanges.deleted.length > 0) {
        await this.responseRepository.delete(responsesChanges.deleted);
      }
    }

    return { success: true };
  }
}