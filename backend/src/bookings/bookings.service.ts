import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { Booking } from './booking.entity';
import { ProvidersService } from '../providers/providers.service';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking) private repo: Repository<Booking>,
    private providers: ProvidersService,
  ) {}

  findByClient(clientId: string) {
    return this.repo.find({
      where: { clientId },
      relations: ['provider', 'provider.user', 'service'],
      order: { date: 'ASC' },
    });
  }

  create(data: { clientId?: string; guestName?: string; guestContact?: string; providerId: string; serviceId: string; date: string; time: string; finalPrice: number }) {
    const booking = this.repo.create(data);
    return this.repo.save(booking);
  }

  getUpcomingCount(userId: string) {
    const today = new Date().toISOString().split('T')[0];
    return this.repo.count({ where: { clientId: userId, status: 'confirmed', date: MoreThanOrEqual(today as any) } });
  }

  async findIncoming(userId: string) {
    const profile = await this.providers.findByUser(userId);
    if (!profile) return [];
    return this.repo.find({
      where: { providerId: profile.id },
      relations: ['client', 'service'],
      order: { date: 'ASC' },
    });
  }

  async getIncomingCount(userId: string) {
    const profile = await this.providers.findByUser(userId);
    if (!profile) return 0;
    const today = new Date().toISOString().split('T')[0];
    return this.repo.count({
      where: { providerId: profile.id, status: 'confirmed', date: MoreThanOrEqual(today as any) },
    });
  }

  async getBookedSlots(providerId: string, date: string): Promise<string[]> {
    const bookings = await this.repo.find({
      where: { providerId, date: date as any, status: 'confirmed' },
      select: ['time'],
    });
    return bookings.map(b => b.time);
  }

  async cancel(id: string, userId: string) {
    const booking = await this.repo.findOne({ where: { id } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.clientId !== userId && booking.providerId !== userId) throw new ForbiddenException();
    booking.status = 'cancelled';
    return this.repo.save(booking);
  }
}
