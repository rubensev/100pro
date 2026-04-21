import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProviderProfile } from './provider.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class ProvidersService {
  constructor(
    @InjectRepository(ProviderProfile) private repo: Repository<ProviderProfile>,
    private users: UsersService,
  ) {}

  findAll() {
    return this.repo.find({ relations: ['user', 'services'] });
  }

  findByUser(userId: string) {
    return this.repo.findOne({ where: { userId }, relations: ['user', 'services', 'promos'] });
  }

  findById(id: string) {
    return this.repo.findOne({ where: { id }, relations: ['user', 'services', 'promos'] });
  }

  async upsert(userId: string, data: Partial<ProviderProfile>) {
    let profile = await this.findByUser(userId);
    if (!profile) {
      profile = this.repo.create({ ...data, userId });
      await this.users.update(userId, { isProvider: true });
    } else {
      Object.assign(profile, data);
    }
    return this.repo.save(profile);
  }
}
