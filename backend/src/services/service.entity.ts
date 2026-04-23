import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn } from 'typeorm';
import { ProviderProfile } from '../providers/provider.entity';
import { Promo } from '../promos/promo.entity';

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ProviderProfile, (p) => p.services, { onDelete: 'CASCADE' })
  @JoinColumn()
  provider: ProviderProfile;

  @Column()
  providerId: string;

  @Column({ nullable: true })
  storeId: string;

  @Column()
  name: string;

  @Column({ type: 'decimal' })
  price: number;

  @Column({ nullable: true })
  duration: number;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @OneToMany(() => Promo, (p) => p.service)
  promos: Promo[];

  @CreateDateColumn()
  createdAt: Date;
}
