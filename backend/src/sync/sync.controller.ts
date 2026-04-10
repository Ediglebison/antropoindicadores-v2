import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { SyncService } from './sync.service';
import { AuthGuard } from '@nestjs/passport';

// Se quiser proteger a rota com JWT (recomendado), descomente a linha abaixo:
// @UseGuards(AuthGuard('jwt')) 
@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  // ROTA GET: O Celular chama essa rota no PULL
  // Ex: http://localhost:3000/sync?lastPulledAt=1712619000000
  @Get()
  async pull(@Query('lastPulledAt') lastPulledAt: string) {
    // Se for a primeira vez (app recém instalado), o lastPulledAt vem vazio ou "0"
    const timestamp = lastPulledAt === 'null' || !lastPulledAt ? 0 : parseInt(lastPulledAt, 10);
    
    return await this.syncService.pullChanges(timestamp);
  }

  // ROTA POST: O Celular chama essa rota no PUSH
  @Post()
  async push(@Body() body: any) {
    const { changes, lastPulledAt } = body;
    
    const timestamp = parseInt(lastPulledAt, 10);
    await this.syncService.pushChanges(changes, timestamp);

    // O WatermelonDB só precisa saber que deu Status 200 OK
    return 'Sync Push OK'; 
  }
}