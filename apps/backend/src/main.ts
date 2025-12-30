/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { AppModule } from './app/app.module';
import {json, urlencoded} from "express";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.enableCors({
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
        exposedHeaders: ['Authorization'],
        preflightContinue: false,
        optionsSuccessStatus: 204,
    });

    app.connectMicroservice({
        transport: Transport.TCP,
        options: { port: 4001 }
    });

    app.use(json({ limit: '500mb' }));
    app.use(urlencoded({ extended: true, limit: '500mb' }));

    await app.startAllMicroservices();
    await app.listen(3030);
}

bootstrap();
