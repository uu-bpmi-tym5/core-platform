import {Inject, Injectable, UnauthorizedException} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import {Repository} from "typeorm";
import {Session} from "./entities/session.entity";

export interface JwtPayload {
  sub: string;
  email: string;
  userId: string;
  sid: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService,
     @Inject('SESSION_REPOSITORY') private readonly sessionRepository: Repository<Session>,
  ) {}

  sessionExpiryDays = 7;

  async generateToken(email: string, userId: string, sid: string): Promise<string> {
    const payload: JwtPayload = { sub: email, email, userId, sid };
    return this.jwtService.signAsync(payload);
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  async comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async createSession(userId: string): Promise<string> {
    const ent = this.sessionRepository.create({
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + this.sessionExpiryDays * 24 * 60 * 60 * 1000),
        user: {
          id: userId
        }
    })

    const session = await this.sessionRepository.save(ent);
    return session.id;
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.sessionRepository.delete(sessionId);
  }

  async deleteAllSessions(userId: string): Promise<void> {
    await this.sessionRepository.delete({ user: { id: userId } });
  }

  async allSessions(userId: string): Promise<Session[]> {
    return this.sessionRepository.find({
      where: { user: { id: userId } },
      relations: ['user']
    });
  }

  async validateSession(sessionId: string): Promise<Session> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['user']
    });

    if (!session) {
      throw new UnauthorizedException('Session not found');
    }

    console.log(session)

    if (session.revokedAt) {
      throw new UnauthorizedException('Session has been revoked');
    }

    if (session.expiresAt < new Date()) {
      throw new UnauthorizedException('Session has expired');
    }

    session.lastSeenAt = new Date();
    await this.sessionRepository.save(session);

    return session;
  }
}
