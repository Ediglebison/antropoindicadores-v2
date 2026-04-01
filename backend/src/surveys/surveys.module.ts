import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SurveysService } from './surveys.service';
import { SurveysController } from './surveys.controller';
import { Survey } from './survey.entity';

@Module({
  imports: [
    // Registra a entidade para o TypeORM usar
    TypeOrmModule.forFeature([Survey]) 
  ],
  controllers: [SurveysController],
  providers: [SurveysService],
  exports: [SurveysService] // Exporta caso outro módulo precise (ex: Mobile Sync)
})
export class SurveysModule {}