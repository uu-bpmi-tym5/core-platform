import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateNotificationInput, UpdateNotificationInput, NotificationCount } from './dto';
import { Notification } from './entities';

@Injectable()
export class NotificationsClient {
    constructor(
        @Inject('NOTIFICATIONS_SERVICE')
        private readonly client: ClientProxy
    ) {}

    async getUserNotifications(userId: string): Promise<Notification[]> {
        return this.client.send('notifications.get_user_notifications', { userId }).toPromise();
    }

    async getUnreadNotifications(userId: string): Promise<Notification[]> {
        return this.client.send('notifications.get_unread_notifications', { userId }).toPromise();
    }

    async getNotificationCount(userId: string): Promise<NotificationCount> {
        return this.client.send('notifications.get_notification_count', { userId }).toPromise();
    }

    async createNotification(input: CreateNotificationInput): Promise<Notification> {
        return this.client.send('notifications.create', input).toPromise();
    }

    async createNotificationForUser(userId: string, input: Omit<CreateNotificationInput, 'userId'>): Promise<Notification> {
        return this.client.send('notifications.create_for_user', { userId, input }).toPromise();
    }

    async markAsRead(notificationId: string, userId: string): Promise<Notification> {
        return this.client.send('notifications.mark_as_read', { notificationId, userId }).toPromise();
    }

    async updateNotification(id: string, input: UpdateNotificationInput): Promise<Notification> {
        return this.client.send('notifications.update', { id, input }).toPromise();
    }

    async deleteNotification(id: string): Promise<{ message: string; success: boolean }> {
        return this.client.send('notifications.delete', { id }).toPromise();
    }

    // Pomocné metody pro různé typy notifikací
    async createInfoNotification(userId: string, title: string, message: string, actionUrl?: string): Promise<Notification> {
        return this.client.send('notifications.create_info', { userId, title, message, actionUrl }).toPromise();
    }

    async createSuccessNotification(userId: string, title: string, message: string, actionUrl?: string): Promise<Notification> {
        return this.client.send('notifications.create_success', { userId, title, message, actionUrl }).toPromise();
    }

    async createWarningNotification(userId: string, title: string, message: string, actionUrl?: string): Promise<Notification> {
        return this.client.send('notifications.create_warning', { userId, title, message, actionUrl }).toPromise();
    }

    async createErrorNotification(userId: string, title: string, message: string, actionUrl?: string): Promise<Notification> {
        return this.client.send('notifications.create_error', { userId, title, message, actionUrl }).toPromise();
    }
}
