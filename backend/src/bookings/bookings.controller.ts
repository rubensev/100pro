import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly svc: BookingsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findMine(@CurrentUser() user: { id: string }) {
    return this.svc.findByClient(user.id);
  }

  @Get('upcoming-count')
  @UseGuards(JwtAuthGuard)
  async upcomingCount(@CurrentUser() user: { id: string }) {
    const count = await this.svc.getUpcomingCount(user.id);
    return { count };
  }

  @Get('incoming')
  @UseGuards(JwtAuthGuard)
  incoming(@CurrentUser() user: { id: string }) {
    return this.svc.findIncoming(user.id);
  }

  @Get('incoming-count')
  @UseGuards(JwtAuthGuard)
  async incomingCount(@CurrentUser() user: { id: string }) {
    const count = await this.svc.getIncomingCount(user.id);
    return { count };
  }

  @Get('booked-slots')
  async bookedSlots(@Query('providerId') providerId: string, @Query('date') date: string) {
    const slots = await this.svc.getBookedSlots(providerId, date);
    return { slots };
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  cancel(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.svc.cancel(id, user.id);
  }

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  create(@CurrentUser() user: { id: string } | null, @Body() body: any) {
    return this.svc.create({ ...body, clientId: user?.id || undefined });
  }
}
