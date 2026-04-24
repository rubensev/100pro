import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlockedDate } from './blocked-date.entity';
import { BlockedDatesService } from './blocked-dates.service';
import { BlockedDatesController } from './blocked-dates.controller';
import { ProvidersModule } from '../providers/providers.module';

@Module({
  imports: [TypeOrmModule.forFeature([BlockedDate]), ProvidersModule],
  controllers: [BlockedDatesController],
  providers: [BlockedDatesService],
  exports: [BlockedDatesService],
})
export class BlockedDatesModule {}
