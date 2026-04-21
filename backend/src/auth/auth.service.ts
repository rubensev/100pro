import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.users.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');
    const hash = await bcrypt.hash(dto.password, 10);
    const initials = dto.name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
    const user = await this.users.create({
      email: dto.email,
      password: hash,
      name: dto.name,
      avatarInitials: initials,
    });
    return this.signToken(user.id, user.email, user.name, user.isProvider);
  }

  async login(dto: LoginDto) {
    const user = await this.users.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    return this.signToken(user.id, user.email, user.name, user.isProvider);
  }

  private signToken(id: string, email: string, name: string, isProvider: boolean) {
    const payload = { sub: id, email, name, isProvider };
    return { accessToken: this.jwt.sign(payload), user: { id, email, name, isProvider } };
  }
}
