import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { BlockedDatesService } from './blocked-dates.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { ProvidersService } from '../providers/providers.service';

@Controller('blocked-dates')
@UseGuards(JwtAuthGuard)
export class BlockedDatesController {
  constructor(private svc: BlockedDatesService, private providers: ProvidersService) {}

  @Get()
  async findMine(@CurrentUser() user: { id: string }) {
    const profile = await this.providers.findByUser(user.id);
    if (!profile) return [];
    return this.svc.findByProvider(profile.id);
  }

  @Post()
  async create(@CurrentUser() user: { id: string }, @Body() body: any) {
    const profile = await this.providers.findByUser(user.id);
    if (!profile) throw new Error('Provider profile not found');
    return this.svc.create({ ...body, providerId: profile.id });
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    const profile = await this.providers.findByUser(user.id);
    if (!profile) return;
    return this.svc.remove(id, profile.id);
  }
}
