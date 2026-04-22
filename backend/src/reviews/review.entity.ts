import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { ProviderProfile } from '../providers/provider.entity';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  client: User;

  @Column()
  clientId: string;

  @ManyToOne(() => ProviderProfile, { onDelete: 'CASCADE' })
  @JoinColumn()
  provider: ProviderProfile;

  @Column()
  providerId: string;

  @Column({ nullable: true })
  bookingId: string;

  @Column({ type: 'int' })
  rating: number;

  @Column({ nullable: true, type: 'text' })
  text: string;

  @CreateDateColumn()
  createdAt: Date;
}
