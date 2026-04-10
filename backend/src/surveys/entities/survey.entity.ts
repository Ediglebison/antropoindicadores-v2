import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';


@Entity('surveys') // O nome exato da tabela no PostgreSQL
export class Survey {
  @PrimaryColumn('varchar') 
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  questions_schema: any;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  // Estas colunas são cruciais para a Sincronização saber o que é novo e velho
  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}