import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, JoinColumn, JoinTable, CreateDateColumn } from 'typeorm';
import { ProviderProfile } from '../providers/provider.entity';

@Entity('stores')
export class Store {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ProviderProfile, { onDelete: 'CASCADE' })
  @JoinColumn()
  provider: ProviderProfile;

  @Column()
  providerId: string;

  @Column()
  name: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ nullable: true })
  coverUrl: string;

  @Column({ nullable: true })
  logoUrl: string;

  @Column({ nullable: true })
  backgroundColor: string;

  @Column({ nullable: true })
  category: string;

  @Column({ default: true })
  active: boolean;

  @ManyToMany(() => ProviderProfile, { eager: false })
  @JoinTable({
    name: 'store_members',
    joinColumn: { name: 'storeId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'providerId', referencedColumnName: 'id' },
  })
  members: ProviderProfile[];

  @CreateDateColumn()
  createdAt: Date;
}
