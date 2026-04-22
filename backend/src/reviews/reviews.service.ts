import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './review.entity';
import { ProviderProfile } from '../providers/provider.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review) private repo: Repository<Review>,
    @InjectRepository(ProviderProfile) private providerRepo: Repository<ProviderProfile>,
  ) {}

  findByProvider(providerId: string) {
    return this.repo.find({
      where: { providerId },
      relations: ['client'],
      order: { createdAt: 'DESC' },
    });
  }

  async create(clientId: string, data: { providerId: string; bookingId?: string; rating: number; text?: string }) {
    if (data.rating < 1 || data.rating > 5) throw new BadRequestException('Rating must be 1-5');
    if (data.bookingId) {
      const existing = await this.repo.findOne({ where: { bookingId: data.bookingId, clientId } });
      if (existing) throw new BadRequestException('Already reviewed this booking');
    }

    const review = this.repo.create({ ...data, clientId });
    const saved = await this.repo.save(review);
    await this.recalcRating(data.providerId);
    return saved;
  }

  private async recalcRating(providerId: string) {
    const reviews = await this.repo.find({ where: { providerId } });
    const count = reviews.length;
    const avg = count > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
    await this.providerRepo.update(providerId, {
      rating: Math.round(avg * 10) / 10,
      reviewsCount: count,
    });
  }
}
