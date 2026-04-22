import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './users/user.entity';
import { ProviderProfile } from './providers/provider.entity';
import { Service } from './services/service.entity';
import { Post } from './posts/post.entity';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userRepo = app.get<Repository<User>>(getRepositoryToken(User));
  const providerRepo = app.get<Repository<ProviderProfile>>(getRepositoryToken(ProviderProfile));
  const serviceRepo = app.get<Repository<Service>>(getRepositoryToken(Service));
  const postRepo = app.get<Repository<Post>>(getRepositoryToken(Post));

  const hash = await bcrypt.hash('test123', 10);

  // -- Maria (provider, Pro plan, beauty)
  let maria = await userRepo.findOne({ where: { email: 'maria@test.com' } });
  if (!maria) {
    maria = await userRepo.save(userRepo.create({
      email: 'maria@test.com',
      password: hash,
      name: 'Maria Oliveira',
      avatarInitials: 'MO',
      plan: 'pro',
      isProvider: true,
    }));
    console.log('Created user: maria@test.com');
  }

  let mariaProfile = await providerRepo.findOne({ where: { userId: maria.id } });
  if (!mariaProfile) {
    mariaProfile = await providerRepo.save(providerRepo.create({
      userId: maria.id,
      role: 'Hair Stylist & Colorist',
      category: 'beauty',
      bio: 'Professional hair stylist with 8 years of experience. Specializing in color treatments, cuts, and styling for all hair types.',
      phone: '+55 11 99999-0001',
      city: 'São Paulo',
      verified: true,
      rating: 4.9,
      reviewsCount: 47,
      jobsCount: 120,
    }));
    console.log('Created provider profile for Maria');
  }

  const existingSvcs = await serviceRepo.find({ where: { providerId: mariaProfile.id } });
  if (existingSvcs.length === 0) {
    await serviceRepo.save([
      serviceRepo.create({ providerId: mariaProfile.id, name: 'Haircut & Styling', price: 80, duration: 60, category: 'beauty', description: 'Cut, wash and blowdry' }),
      serviceRepo.create({ providerId: mariaProfile.id, name: 'Full Color Treatment', price: 180, duration: 120, category: 'beauty', description: 'Root color + highlights + toning' }),
      serviceRepo.create({ providerId: mariaProfile.id, name: 'Keratin Treatment', price: 250, duration: 180, category: 'beauty', description: 'Brazilian keratin smoothing' }),
    ]);
    console.log('Created services for Maria');
  }

  const existingPosts = await postRepo.find({ where: { authorId: maria.id } });
  if (existingPosts.length === 0) {
    await postRepo.save([
      postRepo.create({ authorId: maria.id, type: 'provider', category: 'beauty', text: '✂️ Just finished this gorgeous balayage transformation! My client went from dark roots to stunning sun-kissed highlights. Book your color consultation today! 🌟', likesCount: 23 }),
      postRepo.create({ authorId: maria.id, type: 'provider', category: 'beauty', text: '💇‍♀️ New week, new looks! Loving these Brazilian blowout results — zero frizz, silky smooth for up to 3 months. Limited slots available this week!', likesCount: 15 }),
    ]);
    console.log('Created posts for Maria');
  }

  // -- João (client, Free plan)
  const joaoExists = await userRepo.findOne({ where: { email: 'joao@test.com' } });
  if (!joaoExists) {
    await userRepo.save(userRepo.create({
      email: 'joao@test.com',
      password: hash,
      name: 'João Silva',
      avatarInitials: 'JS',
      plan: 'free',
      isProvider: false,
    }));
    console.log('Created user: joao@test.com');
  }

  console.log('\nSeed complete!');
  console.log('  maria@test.com / test123  →  provider, Pro plan');
  console.log('  joao@test.com  / test123  →  client, Free plan');

  await app.close();
}

seed().catch(err => { console.error(err); process.exit(1); });
