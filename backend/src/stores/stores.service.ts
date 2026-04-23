import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from './store.entity';
import { ProvidersService } from '../providers/providers.service';
import { UsersService } from '../users/users.service';

const PLAN_LIMITS: Record<string, number> = { free: 0, pro: 1, master: 2 };

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Store) private repo: Repository<Store>,
    private providers: ProvidersService,
    private users: UsersService,
  ) {}

  searchPublic(q: string) {
    const like = `%${q.toLowerCase()}%`;
    return this.repo.createQueryBuilder('s')
      .leftJoinAndSelect('s.provider', 'provider')
      .leftJoinAndSelect('provider.user', 'user')
      .where('s.active = true AND (LOWER(s.name) LIKE :like OR LOWER(s.description) LIKE :like OR LOWER(s.category) LIKE :like)', { like })
      .getMany();
  }

  async findByUser(userId: string) {
    const provider = await this.providers.findByUser(userId);
    if (!provider) return [];
    return this.repo.find({ where: { providerId: provider.id }, order: { createdAt: 'ASC' } });
  }

  findByProviderId(providerId: string) {
    return this.repo.find({ where: { providerId, active: true }, order: { createdAt: 'ASC' } });
  }

  async create(userId: string, data: Partial<Store>) {
    const user = await this.users.findById(userId);
    const userPlan = user?.plan || 'free';
    const provider = await this.providers.findByUser(userId);
    if (!provider) throw new ForbiddenException('Provider profile required');

    const limit = PLAN_LIMITS[userPlan] ?? 0;
    if (limit === 0) throw new ForbiddenException('Upgrade to Pro or Master to create stores');

    const existing = await this.repo.count({ where: { providerId: provider.id } });
    if (existing >= limit) throw new ForbiddenException(`Your plan allows ${limit} store(s). Upgrade to add more.`);

    const store = this.repo.create({ ...data, providerId: provider.id });
    return this.repo.save(store);
  }

  async update(id: string, userId: string, data: Partial<Store>) {
    const store = await this.findOwnedStore(id, userId);
    Object.assign(store, data);
    return this.repo.save(store);
  }

  async delete(id: string, userId: string) {
    const store = await this.findOwnedStore(id, userId);
    return this.repo.remove(store);
  }

  async updateCover(id: string, userId: string, coverUrl: string) {
    const store = await this.findOwnedStore(id, userId);
    store.coverUrl = coverUrl;
    return this.repo.save(store);
  }

  private async findOwnedStore(id: string, userId: string) {
    const provider = await this.providers.findByUser(userId);
    if (!provider) throw new NotFoundException('Provider not found');
    const store = await this.repo.findOne({ where: { id, providerId: provider.id } });
    if (!store) throw new NotFoundException('Store not found');
    return store;
  }
}
