import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './service.entity';
import { ProvidersService } from '../providers/providers.service';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service) private repo: Repository<Service>,
    private providers: ProvidersService,
  ) {}

  searchPublic(q: string) {
    const like = `%${q.toLowerCase()}%`;
    return this.repo.createQueryBuilder('s')
      .leftJoinAndSelect('s.provider', 'provider')
      .leftJoinAndSelect('provider.user', 'user')
      .where('LOWER(s.name) LIKE :like OR LOWER(s.description) LIKE :like OR LOWER(s.category) LIKE :like', { like })
      .getMany();
  }

  async findByProvider(userId: string) {
    const profile = await this.providers.findByUser(userId);
    if (!profile) return [];
    return this.repo.find({ where: { providerId: profile.id } });
  }

  async create(userId: string, data: Partial<Service>) {
    let profile = await this.providers.findByUser(userId);
    if (!profile) profile = await this.providers.upsert(userId, {});
    const svc = this.repo.create({ ...data, providerId: profile.id });
    return this.repo.save(svc);
  }

  async update(id: string, userId: string, data: Partial<Service>) {
    const profile = await this.providers.findByUser(userId);
    const svc = await this.repo.findOne({ where: { id } });
    if (!svc || svc.providerId !== profile?.id) throw new ForbiddenException();
    Object.assign(svc, data);
    return this.repo.save(svc);
  }

  async remove(id: string, userId: string) {
    const profile = await this.providers.findByUser(userId);
    const svc = await this.repo.findOne({ where: { id } });
    if (!svc || svc.providerId !== profile?.id) throw new ForbiddenException();
    return this.repo.remove(svc);
  }

  findByStore(storeId: string) {
    return this.repo.find({
      where: { storeId },
      relations: ['provider', 'provider.user'],
      order: { createdAt: 'ASC' },
    });
  }
}
