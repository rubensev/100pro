import { Controller, Get, Put, Body, UseGuards, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { ProvidersService } from './providers.service';

@Controller('providers')
export class ProvidersController {
  constructor(private readonly svc: ProvidersService) {}

  @Get()
  findAll() {
    return this.svc.findAll();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMyProfile(@CurrentUser() user: { id: string }) {
    return this.svc.findByUser(user.id);
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
}
