import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Promo } from './promo.entity';
import { PromosService } from './promos.service';
import { PromosController } from './promos.controller';
import { ProvidersModule } from '../providers/providers.module';

@Module({
  imports: [TypeOrmModule.forFeature([Promo]), ProvidersModule],
  providers: [PromosService],
  controllers: [PromosController],
})
export class PromosModule {}
