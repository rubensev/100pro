import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Service } from '../services/service.entity';
import { ProviderProfile } from '../providers/provider.entity';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn()
  client: User;

  @Column({ nullable: true })
  clientId: string;

  @Column({ nullable: true })
  guestName: string;

  @Column({ nullable: true })
  guestContact: string;

  @ManyToOne(() => ProviderProfile, { onDelete: 'CASCADE' })
  @JoinColumn()
  provider: ProviderProfile;

  @Column()
  providerId: string;

  @ManyToOne(() => Service, { onDelete: 'CASCADE' })
  @JoinColumn()
  service: Service;

  @Column()
  serviceId: string;

  @Column({ type: 'date' })
  date: Date;

  @Column()
  time: string;

  @Column({ type: 'decimal', nullable: true })
  finalPrice: number;

  @Column({ default: 'confirmed' })
  status: 'confirmed' | 'cancelled' | 'completed';

  @CreateDateColumn()
  createdAt: Date;
}
