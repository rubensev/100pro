import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProvidersModule } from './providers/providers.module';
import { PostsModule } from './posts/posts.module';
import { ServicesModule } from './services/services.module';
import { BookingsModule } from './bookings/bookings.module';
import { PromosModule } from './promos/promos.module';
import { MessagesModule } from './messages/messages.module';
import { StoresModule } from './stores/stores.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'postgres',
        host: cfg.get('DATABASE_HOST', 'localhost'),
        port: cfg.get<number>('DATABASE_PORT', 5432),
        username: cfg.get('DATABASE_USER', 'postgres'),
        password: cfg.get('DATABASE_PASS', 'postgres'),
        database: cfg.get('DATABASE_NAME', 'hundredpro'),
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),
    AuthModule,
    UsersModule,
    ProvidersModule,
    PostsModule,
    ServicesModule,
    BookingsModule,
    PromosModule,
    MessagesModule,
    StoresModule,
  ],
})
export class AppModule {}
