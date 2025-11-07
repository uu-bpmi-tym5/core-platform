import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { Session } from '../auth/entities/session.entity';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import type { JwtPayload } from '../auth/auth.service';

@Resolver(() => User)
export class UserResolver {
    constructor(private readonly userService: UsersService) {}

    @Query(() => String)
    async hello(): Promise<string> {
        return 'Hello World!';
    }

    @Mutation(() => User)
    async createUser(
        @Args('email') email: string,
        @Args('name') name: string,
        @Args('password') password: string,
    ): Promise<User> {
        return this.userService.create({ email, name, password });
    }

    @Mutation(() => String)
    async login(
        @Args('email') email: string,
        @Args('password') password: string,
    ): Promise<string> {
        return this.userService.login(email, password);
    }

    @Mutation(() => Boolean)
    async deleteSession(
        @Args('sessionId') sessionId: string,
    ): Promise<boolean> {
        await this.userService.deleteSession(sessionId);
        return true;
    }

    @Mutation(() => Boolean)
    async deleteAllSessions(
        @Args('userId') userId: string,
    ): Promise<boolean> {
        await this.userService.deleteAllSessions(userId);
        return true;
    }

    @Query(() => [Session])
    async getAllSessions(
        @Args('userId') userId: string,
    ): Promise<Session[]> {
        return this.userService.getAllSessions(userId);
    }

    @Query(() => User)
    @UseGuards(JwtAuthGuard)
    async me(@GetCurrentUser() currentUser: JwtPayload): Promise<User> {
        const user = await this.userService.findById(currentUser.userId);
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    }
}