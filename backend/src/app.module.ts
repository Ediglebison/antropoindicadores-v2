import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { User } from './users/user.entity';
import { Location } from './locations/entities/location.entity';
import { Survey } from './surveys/entities/survey.entity';
import { LocationsModule } from './locations/locations.module';
import { ResponsesModule } from './responses/responses.module'

import { Response } from './responses/entities/response.entity';
import { SurveysModule } from './surveys/surveys.module';

import { SyncModule } from './sync/sync.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres', 
      host: process.env.DB_HOST, 
      port: parseInt(process.env.DB_PORT|| '5432', 10),
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      entities: [User, Location, Survey, Response],autoLoadEntities: true,
      synchronize: true,
    }), 
    UsersModule,
    AuthModule,
    SurveysModule,
    LocationsModule,
    ResponsesModule,
    SyncModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}