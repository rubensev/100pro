import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne } from 'typeorm';
import { ProviderProfile } from '../providers/provider.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  avatarInitials: string;

  @Column({ nullable: true })
  avatarColor: string;

  @Column({ default: false })
  isProvider: boolean;

  @OneToOne(() => ProviderProfile, (p) => p.user, { nullable: true })
  providerProfile: ProviderProfile;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
