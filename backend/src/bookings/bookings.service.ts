import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from './booking.entity';

@Injectable()
export class BookingsService {
  constructor(@InjectRepository(Booking) private repo: Repository<Booking>) {}

  findByClient(clientId: string) {
    return this.repo.find({
      where: { clientId },
      relations: ['provider', 'provider.user', 'service'],
      order: { date: 'ASC' },
    });
  }

  create(clientId: string, data: { providerId: string; serviceId: string; date: string; time: string; finalPrice: number }) {
    const booking = this.repo.create({ ...data, clientId });
    return this.repo.save(booking);
  }
}
