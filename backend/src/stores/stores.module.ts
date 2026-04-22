import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Store } from './store.entity';
import { StoresService } from './stores.service';
import { StoresController } from './stores.controller';
import { ProvidersModule } from '../providers/providers.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Store]), ProvidersModule, UsersModule],
  providers: [StoresService],
  controllers: [StoresController],
})
export class StoresModule {}
