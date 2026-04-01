import { Injectable, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findOneByCode(access_code: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { access_code } });
  }

  async findOneById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  // --- CORREÇÃO IMPORTANTE AQUI ---
  async create(data: Partial<User>): Promise<User> {
    try {
      const newUser = this.usersRepository.create(data);
      return await this.usersRepository.save(newUser);
    } catch (error) {
      // Se o erro for de duplicidade (código 23505 no Postgres)
      if (error.code === '23505') {
        throw new ConflictException('Este código de acesso já está em uso.');
      }
      // Outros erros (ex: coluna não existe)
      console.error("Erro ao salvar usuário:", error);
      throw new InternalServerErrorException('Erro ao salvar no banco de dados.');
    }
  }

  async remove(id: string): Promise<void> {
    await this.usersRepository.delete(id);
  }

  async update(id: string, data: any): Promise<User> {
    const user = await this.findOneById(id);
    
    // 1. Verifica se existe antes de tentar atualizar
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    if (data.password) {
      const salt = await bcrypt.genSalt();
      data.password_hash = await bcrypt.hash(data.password, salt);
    }
    
    // Removemos o campo 'password' puro do objeto para não salvar texto plano
    delete data.password;

    // Atualiza
    await this.usersRepository.update(id, data);
    
    // 2. Busca o usuário atualizado
    const updatedUser = await this.findOneById(id);

    // 3. CORREÇÃO DO ERRO:
    // Se por algum motivo bizarro o usuário sumiu (null), lançamos erro.
    // Isso satisfaz o TypeScript que exige um "User" e não "User | null".
    if (!updatedUser) {
        throw new Error('Erro ao recuperar usuário após atualização.');
    }
    
    return updatedUser;
  }
}