import { Controller, Get, Post, Put, Delete, Patch, Param, Query, Body, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
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

  @Get(':id/public')
  getPublic(@Param('id') id: string) {
    return this.svc.getPublicStore(id);
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
    return this.svc.updateCover(id, user.id, `/uploads/stores/${file.filename}`);
  }

  @Post(':id/logo')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('logo', {
    storage: diskStorage({
      destination: './uploads/stores',
      filename: (_, file, cb) => cb(null, 'logo-' + Date.now() + extname(file.originalname)),
    }),
    limits: { fileSize: 4 * 1024 * 1024 },
  }))
  async uploadLogo(@Param('id') id: string, @CurrentUser() user: { id: string }, @UploadedFile() file: any) {
    return this.svc.updateLogo(id, user.id, `/uploads/stores/${file.filename}`);
  }

  @Post(':id/members')
  @UseGuards(JwtAuthGuard)
  addMember(@Param('id') id: string, @CurrentUser() user: { id: string }, @Body() body: { providerId: string }) {
    return this.svc.addMember(id, user.id, body.providerId);
  }

  @Delete(':id/members/:providerId')
  @UseGuards(JwtAuthGuard)
  removeMember(@Param('id') id: string, @Param('providerId') providerId: string, @CurrentUser() user: { id: string }) {
    return this.svc.removeMember(id, user.id, providerId);
  }
}
