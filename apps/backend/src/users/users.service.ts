import { Injectable, Inject, UnauthorizedException, ConflictException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateUserInput } from './dto/create-user.input';
import { firstValueFrom } from 'rxjs';
import {Repository} from "typeorm";
import {User} from "./entities/user.entity";
import {Session} from "../auth/entities/session.entity";


@Injectable()
export class UsersService {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
    @Inject('USER_REPOSITORY') private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserInput: CreateUserInput) {
    const { email, name, password } = createUserInput;
    const exists = await this.userRepository.findOne({where: {email}});
    if (exists) {
      throw new ConflictException('User already exists');
    }

    const passwordHash = await firstValueFrom(
      this.authClient.send<string>('hashPassword', password)
    );

    const user = this.userRepository.create({email, name, password: passwordHash});
    return this.userRepository.save(user);
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

    return firstValueFrom(
      this.authClient.send<string>('generateToken', {email, userId: user.id, sessionId})
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
}
