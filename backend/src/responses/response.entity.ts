import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Survey } from '../surveys/survey.entity';
import { Location } from '../locations/location.entity';

@Entity('responses')
export class Response {
  
  // A SOLUÇÃO ESTÁ AQUI: Isso diz ao banco para gerar o UUID automaticamente
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // O JSONB com as respostas
  @Column({ type: 'jsonb' })
  data_payload: any;

  // A data em que o questionário foi coletado
  @CreateDateColumn()
  collected_at: Date;

  // Data de sincronização (opcional)
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  synced_at: Date;

  // --- RELACIONAMENTOS ---

  @ManyToOne(() => User)
  @JoinColumn({ name: 'researcher_id' })
  researcher: User;

  @ManyToOne(() => Survey)
  @JoinColumn({ name: 'survey_id' })
  survey: Survey;

  @ManyToOne(() => Location)
  @JoinColumn({ name: 'location_id' })
  location: Location;
}