import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletResolver } from './wallet.resolver';
import { walletProviders } from './wallet.providers';
import { DatabaseModule } from '../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [DatabaseModule, NotificationsModule.withClient()],
  providers: [
    ...walletProviders,
    WalletService,
    WalletResolver,
  ],
  exports: [WalletService],
})
export class WalletModule {}
