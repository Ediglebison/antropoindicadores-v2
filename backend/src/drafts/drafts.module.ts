import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DraftsService } from './drafts.service';
import { DraftsController } from './drafts.controller';
import { Draft } from './entities/draft.entity';
import { ResponsesModule } from '../responses/responses.module';

@Module({
  imports: [TypeOrmModule.forFeature([Draft]), ResponsesModule],
  controllers: [DraftsController],
  providers: [DraftsService],
  exports: [DraftsService],
})
export class DraftsModule {}
