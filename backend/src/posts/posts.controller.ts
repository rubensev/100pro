import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
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

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  findMine(@CurrentUser() user: { id: string }) {
    return this.svc.findByAuthor(user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: { id: string }, @Body() body: any) {
    return this.svc.create(user.id, body);
  }

  @Post(':id/image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: join(__dirname, '..', '..', '..', 'uploads', 'posts'),
      filename: (_, file, cb) => cb(null, Date.now() + extname(file.originalname)),
    }),
    limits: { fileSize: 8 * 1024 * 1024 },
  }))
  async uploadImage(@Param('id') id: string, @CurrentUser() user: { id: string }, @UploadedFile() file: any) {
    const imageUrl = `/uploads/posts/${file.filename}`;
    const post = await this.svc.updateMedia(id, user.id, { imageUrl });
    return post;
  }

  @Patch(':id/video')
  @UseGuards(JwtAuthGuard)
  async setVideo(@Param('id') id: string, @CurrentUser() user: { id: string }, @Body() body: { videoUrl: string }) {
    return this.svc.updateMedia(id, user.id, { videoUrl: body.videoUrl });
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
