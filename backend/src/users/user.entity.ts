import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { Response } from '../responses/response.entity';

export enum UserRole {
  ADMIN = 'ADMIN',
  RESEARCHER = 'RESEARCHER',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ unique: true, length: 20 })
  access_code: string;

  @Column()
  password_hash: string;

  // NOVA COLUNA: Define o perfil
  @Column({ type: 'enum', enum: UserRole, default: UserRole.RESEARCHER })
  role: UserRole;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => Response, (response) => response.researcher)
  responses: Response[];
}