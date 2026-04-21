import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { ProviderProfile } from '../providers/provider.entity';
import { Service } from '../services/service.entity';

@Entity('promos')
export class Promo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ProviderProfile, (p) => p.promos, { onDelete: 'CASCADE' })
  @JoinColumn()
  provider: ProviderProfile;

  @Column()
  providerId: string;

  @ManyToOne(() => Service, (s) => s.promos, { onDelete: 'CASCADE' })
  @JoinColumn()
  service: Service;

  @Column()
  serviceId: string;

  @Column()
  title: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column()
  discountPct: number;

  @Column({ nullable: true, type: 'date' })
  endsAt: Date;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
