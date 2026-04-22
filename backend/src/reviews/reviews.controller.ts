import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly svc: ReviewsService) {}

  @Get('provider/:providerId')
  getByProvider(@Param('providerId') providerId: string) {
    return this.svc.findByProvider(providerId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: { id: string }, @Body() body: { providerId: string; bookingId?: string; rating: number; text?: string }) {
    return this.svc.create(user.id, body);
  }
}
