import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';

@Controller('messages')
export class MessagesController {
  constructor(private readonly svc: MessagesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  conversations(@CurrentUser() user: { id: string }) {
    return this.svc.getConversations(user.id);
  }

  @Get(':otherId')
  @UseGuards(JwtAuthGuard)
  thread(@CurrentUser() user: { id: string }, @Param('otherId') otherId: string) {
    return this.svc.getThread(user.id, otherId);
  }

  @Get('unread-count')
  @UseGuards(JwtAuthGuard)
  async unreadCount(@CurrentUser() user: { id: string }) {
    const count = await this.svc.getUnreadCount(user.id);
    return { count };
  }

  @Patch(':otherId/read')
  @UseGuards(JwtAuthGuard)
  markRead(@CurrentUser() user: { id: string }, @Param('otherId') otherId: string) {
    return this.svc.markThreadRead(user.id, otherId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  send(@CurrentUser() user: { id: string }, @Body() body: { receiverId: string; text: string }) {
    return this.svc.send(user.id, body.receiverId, body.text);
  }
}
