import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';

import { Survey } from '../surveys/entities/survey.entity';
import { Location } from '../locations/entities/location.entity';
import { Response } from '../responses/entities/response.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Survey, Location, Response, User])],
  controllers: [SyncController],
  providers: [SyncService],
})
export class SyncModule {}