import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Promo } from './promo.entity';
import { ProvidersService } from '../providers/providers.service';

@Injectable()
export class PromosService {
  constructor(
    @InjectRepository(Promo) private repo: Repository<Promo>,
    private providers: ProvidersService,
  ) {}

  findActive() {
    return this.repo.find({
      where: { active: true },
      relations: ['provider', 'provider.user', 'service'],
    });
  }

  async findByProvider(userId: string) {
    const profile = await this.providers.findByUser(userId);
    if (!profile) return [];
    return this.repo.find({ where: { providerId: profile.id }, relations: ['service'] });
  }

  async create(userId: string, data: Partial<Promo>) {
    const profile = await this.providers.findByUser(userId);
    if (!profile) throw new ForbiddenException('Provider profile required');
    const promo = this.repo.create({ ...data, providerId: profile.id, active: true });
    return this.repo.save(promo);
  }

  async update(id: string, userId: string, data: Partial<Promo>) {
    const profile = await this.providers.findByUser(userId);
    const promo = await this.repo.findOne({ where: { id } });
    if (!promo || promo.providerId !== profile?.id) throw new ForbiddenException();
    Object.assign(promo, data);
    return this.repo.save(promo);
  }

  async remove(id: string, userId: string) {
    const profile = await this.providers.findByUser(userId);
    const promo = await this.repo.findOne({ where: { id } });
    if (!promo || promo.providerId !== profile?.id) throw new ForbiddenException();
    return this.repo.remove(promo);
  }
}
