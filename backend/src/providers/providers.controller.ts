import { Controller, Get, Put, Post, Body, UseGuards, Param, Query, UseInterceptors, UploadedFile, Request, NotFoundException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { ProvidersService } from './providers.service';
import { UsersService } from '../users/users.service';

@Controller('providers')
export class ProvidersController {
  constructor(
    private readonly svc: ProvidersService,
    private readonly users: UsersService,
  ) {}

  @Get()
  findAll(@Query('q') q?: string, @Query('city') city?: string, @Query('minRating') minRating?: string) {
    return this.svc.findAll(q, city, minRating ? parseFloat(minRating) : undefined);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMyProfile(@CurrentUser() user: { id: string }) {
    return this.svc.findByUser(user.id);
  }

  @Get('user/:userId')
  findByUserId(@Param('userId') userId: string) {
    return this.svc.findByUser(userId);
  }

  @Get(':id/public')
  async getPublicProfile(@Param('id') id: string) {
    const profile = await this.svc.findPublicProfile(id);
    if (!profile) throw new NotFoundException('Provider not found');
    return profile;
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findById(id);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  updateMyProfile(@CurrentUser() user: { id: string }, @Body() body: any) {
    return this.svc.upsert(user.id, body);
  }

  @Post('me/cover')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('cover', {
    storage: diskStorage({
      destination: './uploads/covers',
      filename: (req: any, file, cb) => {
        cb(null, `provider-${req.user.id}${extname(file.originalname)}`);
      },
    }),
    fileFilter: (_req, file, cb) => {
      if (!file.mimetype.match(/image\/(jpg|jpeg|png|webp)/)) {
        return cb(new Error('Only image files are allowed'), false);
      }
      cb(null, true);
    },
    limits: { fileSize: 10 * 1024 * 1024 },
  }))
  async uploadCover(@Request() req, @UploadedFile() file: any) {
    const coverUrl = `/uploads/covers/${file.filename}`;
    await this.svc.upsert(req.user.id, { coverUrl });
    return { coverUrl };
  }
}
