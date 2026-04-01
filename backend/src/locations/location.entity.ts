import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Response } from '../responses/response.entity';

@Entity('locations')
export class Location {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true, length: 20 })
  unique_code: string; // Código para identificar o local no app (ex: LOC-AM-01)

  @Column({ nullable: true })
  address: string;

  @Column({ type: 'float', nullable: true })
  latitude: number;

  @Column({ type: 'float', nullable: true })
  longitude: number;

  // Relacionamento: Um local tem várias respostas vinculadas a ele
  @OneToMany(() => Response, (response) => response.location)
  responses: Response[];
}