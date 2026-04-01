import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { User } from './users/user.entity';
import { Location } from './locations/location.entity';
import { Survey } from './surveys/survey.entity';
import { LocationsModule } from './locations/locations.module';
import { ResponsesModule } from './responses/responses.module'

import { Response } from './responses/response.entity';
import { SurveysModule } from './surveys/surveys.module';

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
      entities: [User, Location, Survey, Response],
      synchronize: true,
    }), 
    UsersModule,
    AuthModule,
    SurveysModule,
    LocationsModule,
    ResponsesModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}