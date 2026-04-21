import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
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

  @Post()
  @UseGuards(JwtAuthGuard)
  send(@CurrentUser() user: { id: string }, @Body() body: { receiverId: string; text: string }) {
    return this.svc.send(user.id, body.receiverId, body.text);
  }
}
