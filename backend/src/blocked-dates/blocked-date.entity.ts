import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('blocked_dates')
export class BlockedDate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  providerId: string;

  @Column({ nullable: true })
  serviceId: string;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date', nullable: true })
  endDate: string;

  @Column({ nullable: true })
  note: string;

  @Column({ default: 'dayoff' })
  type: 'dayoff' | 'vacation';

  @CreateDateColumn()
  createdAt: Date;
}
