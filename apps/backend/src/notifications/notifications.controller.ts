import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { NotificationsService } from './notifications.service';
import { CreateNotificationInput, UpdateNotificationInput } from './dto';

interface UserContext {
    userId: string;
}

interface NotificationWithUser {
    input: CreateNotificationInput;
    userId: string;
}

interface UpdateNotificationPayload {
    id: string;
    input: UpdateNotificationInput;
}

interface MarkAsReadPayload {
    notificationId: string;
    userId: string;
}

@Controller()
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) {}

    @MessagePattern('notifications.get_user_notifications')
    async getMyNotifications(@Payload() data: UserContext) {
        return this.notificationsService.getNotificationsByUserId(data.userId);
    }

    @MessagePattern('notifications.get_unread_notifications')
    async getMyUnreadNotifications(@Payload() data: UserContext) {
        return this.notificationsService.getUnreadNotificationsByUserId(data.userId);
    }

    @MessagePattern('notifications.get_notification_count')
    async getNotificationCount(@Payload() data: UserContext) {
        return this.notificationsService.getNotificationCount(data.userId);
    }

    @MessagePattern('notifications.create')
    async createNotification(@Payload() data: CreateNotificationInput) {
        return this.notificationsService.createNotification(data);
    }

    @MessagePattern('notifications.create_for_user')
    async createNotificationForUser(@Payload() data: NotificationWithUser) {
        return this.notificationsService.createNotification({
            ...data.input,
            userId: data.userId
        });
    }

    @MessagePattern('notifications.mark_as_read')
    async markAsRead(@Payload() data: MarkAsReadPayload) {
        return this.notificationsService.markAsRead(data.notificationId);
    }

    @MessagePattern('notifications.update')
    async updateNotification(@Payload() data: UpdateNotificationPayload) {
        return this.notificationsService.updateNotification(data.id, data.input);
    }

    @MessagePattern('notifications.delete')
    async deleteNotification(@Payload() data: { id: string }) {
        await this.notificationsService.deleteNotification(data.id);
        return { message: 'Notifikace byla úspěšně smazána', success: true };
    }

    // Pomocné message patterns pro různé typy notifikací
    @MessagePattern('notifications.create_info')
    async createInfoNotification(@Payload() data: { userId: string; title: string; message: string; actionUrl?: string }) {
        return this.notificationsService.createInfoNotification(
            data.userId,
            data.title,
            data.message,
            data.actionUrl
        );
    }

    @MessagePattern('notifications.create_success')
    async createSuccessNotification(@Payload() data: { userId: string; title: string; message: string; actionUrl?: string }) {
        return this.notificationsService.createSuccessNotification(
            data.userId,
            data.title,
            data.message,
            data.actionUrl
        );
    }

    @MessagePattern('notifications.create_warning')
    async createWarningNotification(@Payload() data: { userId: string; title: string; message: string; actionUrl?: string }) {
        return this.notificationsService.createWarningNotification(
            data.userId,
            data.title,
            data.message,
            data.actionUrl
        );
    }

    @MessagePattern('notifications.create_error')
    async createErrorNotification(@Payload() data: { userId: string; title: string; message: string; actionUrl?: string }) {
        return this.notificationsService.createErrorNotification(
            data.userId,
            data.title,
            data.message,
            data.actionUrl
        );
    }
}
