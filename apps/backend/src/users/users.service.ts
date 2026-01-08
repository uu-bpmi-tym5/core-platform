import { Injectable, Inject, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateUserInput } from './dto/create-user.input';
import { firstValueFrom } from 'rxjs';
import {Repository} from "typeorm";
import {User} from "./entities/user.entity";
import {Session} from "../auth/entities/session.entity";
import { Role } from '../auth/enums/role.enum';
import { Profile } from './entities/profile.entity';
import { ProfileService } from './profile.service';
import { AuditLogService, AuditAction } from '../audit-log';


@Injectable()
export class UsersService {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
    @Inject('USER_REPOSITORY') private readonly userRepository: Repository<User>,
    private readonly profileService: ProfileService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(createUserInput: CreateUserInput) {
    const { email, name, password, role } = createUserInput;
    const exists = await this.userRepository.findOne({where: {email}});
    if (exists) {
      throw new ConflictException('User already exists');
    }

    const passwordHash = await firstValueFrom(
      this.authClient.send<string>('hashPassword', password)
    );

    const user = this.userRepository.create({email, name, password: passwordHash, role});
    const savedUser = await this.userRepository.save(user);

    await this.auditLogService.logSuccess(
      AuditAction.USER_REGISTER,
      'user',
      savedUser.id,
      `User "${savedUser.name}" registered with email ${savedUser.email}`,
      {
        actorId: savedUser.id,
        newValues: {
          email: savedUser.email,
          name: savedUser.name,
          role: savedUser.role,
        },
        entityOwnerId: savedUser.id,
      },
    );

    return savedUser;
  }

  async login(email: string, password: string) {
    const user = await this.userRepository.findOne({where: {email}});
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await firstValueFrom(
      this.authClient.send<boolean>('comparePasswords', { password, hash: user.password })
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const sessionId = await firstValueFrom(
          this.authClient.send<string>('createSession', user.id)
    );

    await this.auditLogService.logSuccess(
      AuditAction.USER_LOGIN,
      'user',
      user.id,
      `User "${user.name}" logged in successfully`,
      {
        actorId: user.id,
        entityOwnerId: user.id,
        metadata: { sessionId },
      },
    );

    return firstValueFrom(
      this.authClient.send<string>('generateToken', {email, userId: user.id, sessionId, role: user.role})
    );
  }

  async deleteSession(sessionId: string): Promise<void> {
    return firstValueFrom(
      this.authClient.send<void>('deleteSession', sessionId)
    );
  }

  async deleteAllSessions(userId: string): Promise<void> {
    return firstValueFrom(
      this.authClient.send<void>('deleteAllSessions', userId)
    );
  }

  async getAllSessions(userId: string) {
    return firstValueFrom(
      this.authClient.send<Session[]>('allSessions', userId)
    );
  }

  async findById(userId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id: userId } });
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async updateUserRole(userId: string, role: Role, actorId?: string): Promise<User> {
    const oldUser = await this.findById(userId);
    if (!oldUser) {
      throw new Error('User not found');
    }
    const oldRole = oldUser.role;

    await this.userRepository.update(userId, { role });
    const user = await this.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    await this.auditLogService.logSuccess(
      AuditAction.USER_ROLE_CHANGE,
      'user',
      userId,
      `User "${user.name}" role changed from ${oldRole} to ${role}`,
      {
        actorId: actorId,
        oldValues: { role: oldRole },
        newValues: { role },
        entityOwnerId: userId,
      },
    );

    return user;
  }

  async getOrCreateProfileForUser(userId: string): Promise<Profile> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.profileService.getOrCreateProfileForUser(user.id, user.name);
  }
}
