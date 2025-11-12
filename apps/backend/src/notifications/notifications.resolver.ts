import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationInput, UpdateNotificationInput, NotificationCount } from './dto';
import { Notification } from './entities';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { User } from '../users/entities/user.entity';

@Resolver(() => Notification)
@UseGuards(JwtAuthGuard)
export class NotificationsResolver {
    constructor(private readonly notificationsService: NotificationsService) {}

    @Query(() => [Notification])
    async getMyNotifications(@GetCurrentUser() user: User): Promise<Notification[]> {
        return this.notificationsService.getNotificationsByUserId(user.id);
    }

    @Query(() => [Notification])
    async getMyUnreadNotifications(@GetCurrentUser() user: User): Promise<Notification[]> {
        return this.notificationsService.getUnreadNotificationsByUserId(user.id);
    }

    @Query(() => NotificationCount)
    async getNotificationCount(@GetCurrentUser() user: User): Promise<NotificationCount> {
        return this.notificationsService.getNotificationCount(user.id);
    }

    @Mutation(() => Notification)
    async createNotification(@Args('input') input: CreateNotificationInput): Promise<Notification> {
        return this.notificationsService.createNotification(input);
    }

    @Mutation(() => Notification)
    async markNotificationAsRead(@Args('notificationId') notificationId: string): Promise<Notification> {
        return this.notificationsService.markAsRead(notificationId);
    }

    @Mutation(() => Notification)
    async updateNotification(
        @Args('id') id: string,
        @Args('input') input: UpdateNotificationInput,
    ): Promise<Notification> {
        return this.notificationsService.updateNotification(id, input);
    }

    @Mutation(() => Boolean)
    async deleteNotification(@Args('id') id: string): Promise<boolean> {
        await this.notificationsService.deleteNotification(id);
        return true;
    }
}
