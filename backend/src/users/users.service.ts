import { Injectable, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return await bcrypt.hash(password, salt);
  }

  async createAdminBypass(body: any) {
    const saltOrRounds = 10;
    const hashedPassword = await bcrypt.hash(body.password, saltOrRounds);

    const novoAdmin = this.usersRepository.create({
      name: body.name,
      access_code: body.access_code.toUpperCase(),
      password_hash: hashedPassword,
      role: UserRole.ADMIN,
    });

    return await this.usersRepository.save(novoAdmin);
  }

  async findOneByCode(access_code: string): Promise<User | null> {
    // Normaliza para maiúsculas antes de buscar
    return this.usersRepository.findOne({ where: { access_code: access_code.toUpperCase() } });
  }

  async findOneById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async create(data: Partial<User>): Promise<User> {
    try {
      // Normaliza o access_code para maiúsculas
      if (data.access_code) {
        data.access_code = data.access_code.toUpperCase();
      }
      
      const newUser = this.usersRepository.create(data);
      return await this.usersRepository.save(newUser);
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('Este código de acesso já está em uso.');
      }
      console.error("Erro ao salvar usuário:", error);
      throw new InternalServerErrorException('Erro ao salvar no banco de dados.');
    }
  }

  async remove(id: string): Promise<void> {
    await this.usersRepository.delete(id);
  }

  async update(id: string, data: any): Promise<User> {
    const user = await this.findOneById(id);
    
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    if (data.password) {
      const salt = await bcrypt.genSalt();
      data.password_hash = await bcrypt.hash(data.password, salt);
    }
    
    delete data.password;

    // Atualiza
    await this.usersRepository.update(id, data);
    
    // 2. Busca o usuário atualizado
    const updatedUser = await this.findOneById(id);

    if (!updatedUser) {
        throw new Error('Erro ao recuperar usuário após atualização.');
    }
    
    return updatedUser;
  }
}