import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlockedDate } from './blocked-date.entity';

@Injectable()
export class BlockedDatesService {
  constructor(@InjectRepository(BlockedDate) private repo: Repository<BlockedDate>) {}

  findByProvider(providerId: string) {
    return this.repo.find({ where: { providerId }, order: { startDate: 'ASC' } });
  }

  create(data: Partial<BlockedDate>) {
    return this.repo.save(this.repo.create(data));
  }

  async remove(id: string, providerId: string) {
    await this.repo.delete({ id, providerId });
  }

  async isDateBlocked(providerId: string, date: string): Promise<boolean> {
    const all = await this.repo.find({ where: { providerId } });
    return all.some(b => {
      if (b.startDate <= date && (!b.endDate || b.endDate >= date)) return true;
      return false;
    });
  }
}
