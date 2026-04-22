import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './message.entity';

@Injectable()
export class MessagesService {
  constructor(@InjectRepository(Message) private repo: Repository<Message>) {}

  async getConversations(userId: string) {
    const msgs = await this.repo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.sender', 'sender')
      .leftJoinAndSelect('m.receiver', 'receiver')
      .where('m.senderId = :uid OR m.receiverId = :uid', { uid: userId })
      .orderBy('m.createdAt', 'DESC')
      .getMany();

    const seen = new Set<string>();
    const convs: Message[] = [];
    for (const m of msgs) {
      const otherId = m.senderId === userId ? m.receiverId : m.senderId;
      if (!seen.has(otherId)) { seen.add(otherId); convs.push(m); }
    }
    return convs;
  }

  getThread(userId: string, otherId: string) {
    return this.repo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.sender', 'sender')
      .where('(m.senderId = :uid AND m.receiverId = :oid) OR (m.senderId = :oid AND m.receiverId = :uid)', { uid: userId, oid: otherId })
      .orderBy('m.createdAt', 'ASC')
      .getMany();
  }

  send(senderId: string, receiverId: string, text: string) {
    const msg = this.repo.create({ senderId, receiverId, text });
    return this.repo.save(msg);
  }

  getUnreadCount(userId: string) {
    return this.repo.count({ where: { receiverId: userId, read: false } });
  }

  markThreadRead(userId: string, otherId: string) {
    return this.repo.update({ receiverId: userId, senderId: otherId, read: false }, { read: true });
  }
}
