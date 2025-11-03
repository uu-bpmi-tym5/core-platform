import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@Resolver(() => User)
export class UserResolver {
    constructor(private readonly userService: UsersService) {}

    @Query(() => String)
    async hello(): Promise<string> {
        return 'Hello World!';
    }

    @Mutation(() => String)
    async createUser(
        @Args('email') email: string,
        @Args('name') name: string,
    ): Promise<string> {
        return this.userService.create({ email, name });
    }

    @Mutation(() => String)
    async login(
        @Args('email') email: string
    ): Promise<string> {
        return this.userService.login(email);
    }
}