import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly svc: BookingsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findMine(@CurrentUser() user: { id: string }) {
    return this.svc.findByClient(user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: { id: string }, @Body() body: any) {
    return this.svc.create(user.id, body);
  }
}
