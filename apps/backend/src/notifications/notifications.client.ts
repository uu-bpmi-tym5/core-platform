import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { CreateNotificationInput, UpdateNotificationInput, NotificationCount } from './dto';
import { Notification } from './entities';

@Injectable()
export class NotificationsClient {
    constructor(
        @Inject('NOTIFICATIONS_SERVICE')
        private readonly client: ClientProxy
    ) {}

    async getUserNotifications(userId: string): Promise<Notification[]> {
        return firstValueFrom(this.client.send('notifications.get_user_notifications', { userId }));
    }

    async getUnreadNotifications(userId: string): Promise<Notification[]> {
        return firstValueFrom(this.client.send('notifications.get_unread_notifications', { userId }));
    }

    async getNotificationCount(userId: string): Promise<NotificationCount> {
        return firstValueFrom(this.client.send('notifications.get_notification_count', { userId }));
    }

    async createNotification(input: CreateNotificationInput): Promise<Notification> {
        return firstValueFrom(this.client.send('notifications.create', input));
    }

    async createNotificationForUser(userId: string, input: Omit<CreateNotificationInput, 'userId'>): Promise<Notification> {
        return firstValueFrom(this.client.send('notifications.create_for_user', { userId, input }));
    }

    async markAsRead(notificationId: string, userId: string): Promise<Notification> {
        return firstValueFrom(this.client.send('notifications.mark_as_read', { notificationId, userId }));
    }

    async updateNotification(id: string, input: UpdateNotificationInput): Promise<Notification> {
        return firstValueFrom(this.client.send('notifications.update', { id, input }));
    }

    async deleteNotification(id: string): Promise<{ message: string; success: boolean }> {
        return firstValueFrom(this.client.send('notifications.delete', { id }));
    }

    // Pomocné metody pro různé typy notifikací
    async createInfoNotification(userId: string, title: string, message: string, actionUrl?: string): Promise<Notification> {
        return firstValueFrom(this.client.send('notifications.create_info', { userId, title, message, actionUrl }));
    }

    async createSuccessNotification(userId: string, title: string, message: string, actionUrl?: string): Promise<Notification> {
        return firstValueFrom(this.client.send('notifications.create_success', { userId, title, message, actionUrl }));
    }

    async createWarningNotification(userId: string, title: string, message: string, actionUrl?: string): Promise<Notification> {
        return firstValueFrom(this.client.send('notifications.create_warning', { userId, title, message, actionUrl }));
    }

    async createErrorNotification(userId: string, title: string, message: string, actionUrl?: string): Promise<Notification> {
        return firstValueFrom(this.client.send('notifications.create_error', { userId, title, message, actionUrl }));
    }
}
