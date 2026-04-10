import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from './entities/location.entity';

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Location)
    private repo: Repository<Location>,
  ) {}

  async create(data: Partial<Location>): Promise<Location> {
    try {
      if (!data.id) {
        data.id = Date.now().toString();
      }
      const location = this.repo.create(data);
      return await this.repo.save(location);
    } catch (error) {
      if (error.code === '23505') { // Erro de duplicidade no Postgres
        throw new ConflictException('Já existe um local com este código.');
      }
      console.error('Erro ao criar location:', error);
      throw error;
    }
  }

  findAll() {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  async update(id: string, data: Partial<Location>) {
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string) {
    return this.repo.delete(id);
  }
}