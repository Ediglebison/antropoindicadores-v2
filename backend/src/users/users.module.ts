import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './user.entity';

@Module({
  imports: [
    // Registra a entidade User neste módulo para que o Repository funcione
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  // IMPORTANTE: Exportamos o Service para que o AuthModule possa usá-lo
  exports: [UsersService], 
})
export class UsersModule {}