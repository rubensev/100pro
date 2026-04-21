import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './booking.entity';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { ProvidersModule } from '../providers/providers.module';

@Module({
  imports: [TypeOrmModule.forFeature([Booking]), ProvidersModule],
  providers: [BookingsService],
  controllers: [BookingsController],
})
export class BookingsModule {}
