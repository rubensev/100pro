import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { StoresService } from './stores.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';

@Controller('stores')
export class StoresController {
  constructor(private readonly svc: StoresService) {}

  @Get('search')
  search(@Query('q') q: string) {
    return this.svc.searchPublic(q || '');
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  getMine(@CurrentUser() user: { id: string }) {
    return this.svc.findByUser(user.id);
  }

  @Get('provider/:providerId')
  getByProvider(@Param('providerId') providerId: string) {
    return this.svc.findByProviderId(providerId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: { id: string }, @Body() body: any) {
    return this.svc.create(user.id, body);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @CurrentUser() user: { id: string }, @Body() body: any) {
    return this.svc.update(id, user.id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.svc.delete(id, user.id);
  }

  @Post(':id/cover')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('cover', {
    storage: diskStorage({
      destination: './uploads/stores',
      filename: (_, file, cb) => cb(null, Date.now() + extname(file.originalname)),
    }),
    limits: { fileSize: 10 * 1024 * 1024 },
  }))
  async uploadCover(@Param('id') id: string, @CurrentUser() user: { id: string }, @UploadedFile() file: any) {
    const coverUrl = `/uploads/stores/${file.filename}`;
    return this.svc.updateCover(id, user.id, coverUrl);
  }
}
