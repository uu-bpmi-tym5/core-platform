import { Injectable, Inject } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Notification, NotificationStatus, NotificationType } from './entities';
import { CreateNotificationInput, UpdateNotificationInput, NotificationCount } from './dto';

@Injectable()
export class NotificationsService {
    constructor(
        @Inject('NOTIFICATION_REPOSITORY')
        private readonly notificationRepository: Repository<Notification>,
    ) {}

    async createNotification(input: CreateNotificationInput): Promise<Notification> {
        const notification = this.notificationRepository.create({
            ...input,
            type: input.type || NotificationType.INFO,
        });

        const savedNotification = await this.notificationRepository.save(notification);

        return savedNotification;
    }

    async getNotificationsByUserId(userId: string): Promise<Notification[]> {
        const notifications = await this.notificationRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });

        return notifications;
    }

    async getUnreadNotificationsByUserId(userId: string): Promise<Notification[]> {
        return await this.notificationRepository.find({
            where: {
                userId,
                status: NotificationStatus.UNREAD
            },
            order: { createdAt: 'DESC' },
        });
    }

    async markAsRead(notificationId: string): Promise<Notification> {
        const notification = await this.notificationRepository.findOne({
            where: { id: notificationId }
        });

        if (!notification) {
            throw new Error('Notifikace nenalezena');
        }

        notification.status = NotificationStatus.READ;
        notification.readAt = new Date();

        return this.notificationRepository.save(notification);
    }

    async updateNotification(id: string, input: UpdateNotificationInput): Promise<Notification> {
        const notification = await this.notificationRepository.findOne({
            where: { id }
        });

        if (!notification) {
            throw new Error('Notifikace nenalezena');
        }

        Object.assign(notification, input);

        if (input.status === NotificationStatus.READ && !notification.readAt) {
            notification.readAt = new Date();
        }

        return await this.notificationRepository.save(notification);
    }

    async deleteNotification(id: string): Promise<void> {
        const result = await this.notificationRepository.delete(id);

        if (result.affected === 0) {
            throw new Error('Notifikace nenalezena');
        }
    }

    async getNotificationCount(userId: string): Promise<NotificationCount> {
        const [total, unread] = await Promise.all([
            this.notificationRepository.count({ where: { userId } }),
            this.notificationRepository.count({
                where: { userId, status: NotificationStatus.UNREAD }
            }),
        ]);

        return { total, unread };
    }

    async createInfoNotification(userId: string, title: string, message: string, actionUrl?: string): Promise<Notification> {
        return this.createNotification({
            userId,
            title,
            message,
            type: NotificationType.INFO,
            actionUrl,
        });
    }

    async createSuccessNotification(userId: string, title: string, message: string, actionUrl?: string): Promise<Notification> {
        return this.createNotification({
            userId,
            title,
            message,
            type: NotificationType.SUCCESS,
            actionUrl,
        });
    }

    async createWarningNotification(userId: string, title: string, message: string, actionUrl?: string): Promise<Notification> {
        return this.createNotification({
            userId,
            title,
            message,
            type: NotificationType.WARNING,
            actionUrl,
        });
    }

    async createErrorNotification(userId: string, title: string, message: string, actionUrl?: string): Promise<Notification> {
        return this.createNotification({
            userId,
            title,
            message,
            type: NotificationType.ERROR,
            actionUrl,
        });
    }
}
