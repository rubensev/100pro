import { Controller, Get, Post, Body, Param, Query, UseGuards, Optional } from '@nestjs/common';
import { PostsService } from './posts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';

@Controller('posts')
export class PostsController {
  constructor(private readonly svc: PostsService) {}

  @Get()
  findAll(@Query('category') category?: string) {
    return this.svc.findAll(category);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: { id: string }, @Body() body: any) {
    return this.svc.create(user.id, body);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  like(@Param('id') id: string) {
    return this.svc.like(id);
  }

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  addComment(@Param('id') id: string, @CurrentUser() user: { id: string }, @Body() body: { text: string }) {
    return this.svc.addComment(id, user.id, body.text);
  }
}
