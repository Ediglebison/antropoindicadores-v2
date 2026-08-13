import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { Survey } from '../../surveys/entities/survey.entity';
import { Location } from '../../locations/entities/location.entity';

@Entity('drafts')
export class Draft {
  @PrimaryColumn('varchar')
  id: string;

  @Column({ type: 'varchar' })
  survey_id: string;

  @Column({ type: 'varchar', nullable: true })
  location_id: string;

  @Column({ type: 'varchar', nullable: true })
  researcher_id: string;

  @Column({ type: 'jsonb' })
  data_payload: any;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

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
