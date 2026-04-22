import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, OneToMany, CreateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Service } from '../services/service.entity';
import { Promo } from '../promos/promo.entity';

@Entity('provider_profiles')
export class ProviderProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (u) => u.providerProfile)
  @JoinColumn()
  user: User;

  @Column()
  userId: string;

  @Column({ nullable: true })
  role: string;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true, type: 'text' })
  bio: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  city: string;

  @Column({ default: false })
  verified: boolean;

  @Column({ type: 'decimal', default: 0 })
  rating: number;

  @Column({ default: 0 })
  reviewsCount: number;

  @Column({ default: 0 })
  jobsCount: number;

  @Column({ nullable: true })
  coverUrl: string;

  @OneToMany(() => Service, (s) => s.provider)
  services: Service[];

  @OneToMany(() => Promo, (p) => p.provider)
  promos: Promo[];

  @CreateDateColumn()
  createdAt: Date;
}
