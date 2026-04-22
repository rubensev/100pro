import {
  Controller, Get, Patch, Post, Body, Request, UseGuards,
  UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateMeDto } from './dto/update-me.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Request() req) {
    const user = await this.users.findById(req.user.id);
    return this.sanitize(user);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateMe(@Request() req, @Body() body: UpdateMeDto) {
    await this.users.update(req.user.id, body);
    const user = await this.users.findById(req.user.id);
    return this.sanitize(user);
  }

  @Patch('me/plan')
  @UseGuards(JwtAuthGuard)
  async updatePlan(@Request() req, @Body() body: UpdatePlanDto) {
    await this.users.update(req.user.id, { plan: body.plan });
    const user = await this.users.findById(req.user.id);
    return this.sanitize(user);
  }

  @Post('me/avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('avatar', {
    storage: diskStorage({
      destination: './uploads/avatars',
      filename: (req: any, file, cb) => {
        cb(null, `${req.user.id}${extname(file.originalname)}`);
      },
    }),
    fileFilter: (_req, file, cb) => {
      if (!file.mimetype.match(/image\/(jpg|jpeg|png|webp|gif)/)) {
        return cb(new Error('Only image files are allowed'), false);
      }
      cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 },
  }))
  async uploadAvatar(@Request() req, @UploadedFile() file: any) {
    const avatarUrl = `/uploads/avatars/${file.filename}`;
    await this.users.update(req.user.id, { avatarUrl });
    const user = await this.users.findById(req.user.id);
    return this.sanitize(user);
  }

  private sanitize(user: any) {
    if (!user) return null;
    const { password, ...safe } = user;
    return safe;
  }
}
