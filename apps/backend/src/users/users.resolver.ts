import { Resolver, Query, Mutation, Args, ResolveField, Parent } from '@nestjs/graphql';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { Session } from '../auth/entities/session.entity';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums';
import type { JwtPayload } from '../auth/auth.service';
import { Profile } from './entities/profile.entity';
import { CreatorProfile } from './entities/creator-profile.entity';
import { ProfileService } from './profile.service';
import { UpdateProfileInput } from './dto/update-profile.input';
import { UpdateCreatorProfileInput } from './dto/update-creator-profile.input';
import { PublicProfile } from './dto/public-profile.output';

@Resolver(() => User)
export class UserResolver {
    constructor(
        private readonly userService: UsersService,
        private readonly profileService: ProfileService,
    ) {}

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

    @Mutation(() => User)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.MODERATOR)
    async updateUserRole(
        @Args('userId') userId: string,
        @Args('role', { type: () => Role }) role: Role,
        @GetCurrentUser() currentUser: JwtPayload,
    ): Promise<User> {
        return this.userService.updateUserRole(userId, role, currentUser.userId);
    }

    @Query(() => [User])
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.MODERATOR)
    async getAllUsers(): Promise<User[]> {
        return this.userService.findAll();
    }

    @Query(() => Profile)
    @UseGuards(JwtAuthGuard)
    async myProfile(@GetCurrentUser() currentUser: JwtPayload): Promise<Profile> {
        return this.userService.getOrCreateProfileForUser(currentUser.userId);
    }

    @Mutation(() => Profile)
    @UseGuards(JwtAuthGuard)
    async updateMyProfile(
        @GetCurrentUser() currentUser: JwtPayload,
        @Args('input') input: UpdateProfileInput,
    ): Promise<Profile> {
        return this.profileService.updateOwnProfile(currentUser.userId, input);
    }

    @Mutation(() => CreatorProfile)
    @UseGuards(JwtAuthGuard)
    async updateMyCreatorProfile(
        @GetCurrentUser() currentUser: JwtPayload,
        @Args('input') input: UpdateCreatorProfileInput,
    ): Promise<CreatorProfile> {
        return this.profileService.updateOwnCreatorProfile(currentUser.userId, input);
    }

    @Query(() => PublicProfile)
    async publicProfileBySlug(@Args('slug') slug: string): Promise<PublicProfile> {
        const { profile, creatorProfile, campaigns } = await this.profileService.getPublicProfileBySlug(slug);
        return { profile, creatorProfile: creatorProfile ?? undefined, campaigns };
    }

    @ResolveField(() => String, { nullable: true })
    async displayName(@Parent() user: User): Promise<string | null> {
        const profile = await this.userService.getOrCreateProfileForUser(user.id);
        return profile.displayName || user.name;
    }

    @ResolveField(() => String, { nullable: true })
    async avatarUrl(@Parent() user: User): Promise<string | null> {
        const profile = await this.userService.getOrCreateProfileForUser(user.id);
        return profile.avatarUrl;
    }
}
