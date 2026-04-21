import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(cfg: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: cfg.get('JWT_SECRET', 'change-me'),
    });
  }

  validate(payload: { sub: string; email: string; name: string; isProvider: boolean }) {
    return { id: payload.sub, email: payload.email, name: payload.name, isProvider: payload.isProvider };
  }
}
