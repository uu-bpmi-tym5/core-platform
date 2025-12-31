import { Module } from '@nestjs/common';
import { GraphQLModule } from "@nestjs/graphql";
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { CampaignsModule } from '../campaigns/campaigns.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { WalletModule } from '../wallet/wallet.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      introspection: true, // Enable introspection for Apollo Sandbox (works with Apollo Server v5)
    }),
    AuditLogModule,
    AuthModule,
    UsersModule,
    CampaignsModule,
    NotificationsModule,
    WalletModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
