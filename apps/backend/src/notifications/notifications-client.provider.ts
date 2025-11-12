import { ClientsModule, Transport } from '@nestjs/microservices';

export const notificationsClientProvider = ClientsModule.register([
    {
        name: 'NOTIFICATIONS_SERVICE',
        transport: Transport.TCP,
        options: {
            host: process.env.NOTIFICATIONS_SERVICE_HOST || 'localhost',
            port: parseInt(process.env.NOTIFICATIONS_SERVICE_PORT!) || 3001,
        },
    },
]);
