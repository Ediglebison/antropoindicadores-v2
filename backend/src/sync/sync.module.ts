import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';

import { Survey } from '../surveys/entities/survey.entity';
import { Location } from '../locations/entities/location.entity';
import { Response } from '../responses/entities/response.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Survey, Location, Response])],
  controllers: [SyncController],
  providers: [SyncService],
})
export class SyncModule {}