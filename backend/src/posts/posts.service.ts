import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './post.entity';
import { Comment } from './comment.entity';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post) private postRepo: Repository<Post>,
    @InjectRepository(Comment) private commentRepo: Repository<Comment>,
  ) {}

  findAll(category?: string) {
    const qb = this.postRepo.createQueryBuilder('p')
      .leftJoinAndSelect('p.author', 'author')
      .leftJoinAndSelect('p.comments', 'comments')
      .leftJoinAndSelect('comments.author', 'commentAuthor')
      .orderBy('p.createdAt', 'DESC');
    if (category && category !== 'all') qb.where('p.category = :category', { category });
    return qb.getMany();
  }

  create(userId: string, data: Partial<Post>) {
    const post = this.postRepo.create({ ...data, authorId: userId });
    return this.postRepo.save(post);
  }

  async like(postId: string) {
    await this.postRepo.increment({ id: postId }, 'likesCount', 1);
    return this.postRepo.findOne({ where: { id: postId } });
  }

  addComment(postId: string, userId: string, text: string) {
    const comment = this.commentRepo.create({ postId, authorId: userId, text });
    return this.commentRepo.save(comment);
  }

  async updateMedia(postId: string, userId: string, data: { imageUrl?: string; videoUrl?: string }) {
    const post = await this.postRepo.findOne({ where: { id: postId, authorId: userId } });
    if (!post) return null;
    Object.assign(post, data);
    return this.postRepo.save(post);
  }

  findByAuthor(userId: string) {
    return this.postRepo.find({
      where: { authorId: userId },
      relations: ['author', 'comments', 'comments.author'],
      order: { createdAt: 'DESC' },
    });
  }
}
