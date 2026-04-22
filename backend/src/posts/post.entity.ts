import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Comment } from './comment.entity';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  author: User;

  @Column()
  authorId: string;

  @Column({ default: 'provider' })
  type: 'provider' | 'client';

  @Column({ type: 'text' })
  text: string;

  @Column({ nullable: true })
  imageLabel: string;

  @Column({ nullable: true })
  imageColor: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ nullable: true })
  videoUrl: string;

  @Column({ nullable: true })
  category: string;

  @Column({ default: 0 })
  likesCount: number;

  @OneToMany(() => Comment, (c) => c.post, { cascade: true })
  comments: Comment[];

  @CreateDateColumn()
  createdAt: Date;
}
