import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';

// 👇 1. OS IMPORTS FALTANTES ESTÃO AQUI!
import { Survey } from '../surveys/entities/survey.entity';
import { Location } from '../locations/entities/location.entity';
import { Response } from '../responses/entities/response.entity';
import { User } from '../users/user.entity';

@Injectable()
export class SyncService {
  constructor(
    @InjectRepository(Survey)
    private surveyRepository: Repository<Survey>,
    
    @InjectRepository(Location)
    private locationRepository: Repository<Location>,
    
    @InjectRepository(Response)
    private responseRepository: Repository<Response>,

    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

    // ==========================================
  // PULL: O SERVIDOR ENVIA QUESTIONÁRIOS E LOCAIS
  // ==========================================
  async pullChanges(lastPulledAt: number) {
    const lastPullDate = new Date(lastPulledAt);

    // Formatadores obrigatórios para o WatermelonDB entender!
    // WatermelonDB exige Datas como NÚMEROS (Unix Timestamp) e JSON como TEXTO (String)
    const formatSurvey = (s: any) => {
      let schemaStr = '';
      if (s.questions_schema) {
         schemaStr = typeof s.questions_schema === 'string' 
           ? s.questions_schema 
           : JSON.stringify(s.questions_schema);
      }
      
      return {
        id: s.id,
        title: s.title,
        description: s.description || '',
        is_active: s.is_active,
        questions_schema: schemaStr,
        created_at: new Date(s.created_at).getTime(),
        updated_at: new Date(s.updated_at).getTime()
      };
    };

    const formatLocation = (l: any) => ({
      id: l.id,
      name: l.name,
      unique_code: l.unique_code || '',
      city: l.city || '',
      state: l.state || '',
      description: l.description || '',
      created_at: new Date(l.created_at).getTime(),
      updated_at: new Date(l.updated_at).getTime()
    });

    const formatUser = (u: any) => ({
      id: u.id,
      name: u.name,
      access_code: u.access_code,
      password_hash: u.password_hash,
      role: u.role,
      created_at: new Date(u.created_at).getTime(),
      // Assume created_at as updated_at for now since user entity doesn't have updated_at
      updated_at: new Date(u.created_at).getTime()
    });

    // 1. Prepara os Questionários (Surveys)
    const surveysAlterados = await this.surveyRepository.find({
      where: { updated_at: MoreThan(lastPullDate) },
    });
    const surveysCreated: any[] = [];
    const surveysUpdated: any[] = [];
    
    surveysAlterados.forEach(survey => {
      const formatted = formatSurvey(survey);
      // Se a data de criação for mais recente que o último PULL, é novo!
      if (new Date(survey.created_at).getTime() > lastPulledAt) {
        surveysCreated.push(formatted);
      } else {
        surveysUpdated.push(formatted);
      }
    });

    // 2. Prepara as Localidades (Locations)
    const locationsAlterados = await this.locationRepository.find({
      where: { updated_at: MoreThan(lastPullDate) },
    });
    const locationsCreated: any[] = [];
    const locationsUpdated: any[] = [];
    
    locationsAlterados.forEach(location => {
      const formatted = formatLocation(location);
      if (new Date(location.created_at).getTime() > lastPulledAt) {
        locationsCreated.push(formatted);
      } else {
        locationsUpdated.push(formatted);
      }
    });

    // 3. Prepara os Usuários (Users)
    // Usuarios no momento nao possuem updated_at, usamos created_at como fallback
    const usersAlterados = await this.userRepository.find({
      // where: { created_at: MoreThan(lastPullDate) }, // Puxar todos os users por garantia ou apenas recentes
    });
    const usersCreated: any[] = [];
    const usersUpdated: any[] = [];

    usersAlterados.forEach(user => {
      const formatted = formatUser(user);
      if (new Date(user.created_at).getTime() > lastPulledAt) {
        usersCreated.push(formatted);
      } else {
        usersUpdated.push(formatted);
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
        users: {
          created: usersCreated,
          updated: usersUpdated,
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