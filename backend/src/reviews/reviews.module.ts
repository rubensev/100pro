import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from './review.entity';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { ProviderProfile } from '../providers/provider.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Review, ProviderProfile])],
  providers: [ReviewsService],
  controllers: [ReviewsController],
})
export class ReviewsModule {}
