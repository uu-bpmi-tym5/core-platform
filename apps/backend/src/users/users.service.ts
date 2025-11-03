import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateUserInput } from './dto/create-user.input';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class UsersService {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
  ) {}

  create(createUserInput: CreateUserInput) {
    return 'This action adds a new user';
  }

  async login(email: string) {
    // Call auth service via microservice to generate token
    const token = await firstValueFrom(
      this.authClient.send<string>('generateToken', email)
    );
    return token;
  }
}
