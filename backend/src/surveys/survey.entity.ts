import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('surveys')
export class Survey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  // Aqui armazenamos a estrutura das perguntas como JSON.
  // Ex: [{ "id": "q1", "type": "text", "label": "Nome?" }, ...]
  @Column({ type: 'jsonb' }) 
  questions_schema: any; 

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;
}