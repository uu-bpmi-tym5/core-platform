import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { UsersService } from './users.service';
import { UserResolver } from './users.resolver';
import { userProviders } from "./user.providers";
import { DatabaseModule } from "../database/database.module";
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.TCP,
        options: {
          host: 'localhost',
          port: 4001,
        },
      },
    ]),
    DatabaseModule,
    AuthModule
  ],
  providers: [UserResolver, UsersService, ...userProviders],
})
export class UsersModule {}
