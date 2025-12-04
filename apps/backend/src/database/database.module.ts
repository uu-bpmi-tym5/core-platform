
import { Module } from '@nestjs/common';
import { databaseProviders } from './database.providers';
import { SeederService } from './seeder.service';
import { userProviders } from '../users/user.providers';

@Module({
    providers: [...databaseProviders, ...userProviders, SeederService],
    exports: [...databaseProviders],
})
export class DatabaseModule {}
