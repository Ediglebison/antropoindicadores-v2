import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResponsesService } from './responses.service';
import { ResponsesController } from './responses.controller';
import { Response } from './response.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Response])],
  controllers: [ResponsesController],
  providers: [ResponsesService],
})
export class ResponsesModule {}