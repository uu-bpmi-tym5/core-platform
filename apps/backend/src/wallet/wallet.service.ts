import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { WalletTX, TransactionType, TransactionStatus } from './entities/wallet-tx.entity';
import { User } from '../users/entities/user.entity';
import { CampaignContribution } from '../campaigns/entities/campaign-contribution.entity';
import { ContributeToCampaignInput, BankWithdrawalInput } from './dto';
import { NotificationsClient } from '../notifications/notifications.client';

@Injectable()
export class WalletService {
  constructor(
    @Inject('WALLET_TX_REPOSITORY')
    private walletTxRepository: Repository<WalletTX>,
    @Inject('USER_REPOSITORY')
    private userRepository: Repository<User>,
    @Inject('CAMPAIGN_CONTRIBUTION_REPOSITORY')
    private contributionRepository: Repository<CampaignContribution>,
    private notificationsClient: NotificationsClient,
  ) {}

  async getUserWalletBalance(userId: string): Promise<number> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['walletBalance']
    });

    if (!user) {
      throw new NotFoundException('Uživatel nebyl nalezen');
    }

    return user.walletBalance;
  }

  async getUserTransactions(userId: string): Promise<WalletTX[]> {
    return this.walletTxRepository.find({
      where: { userId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async depositMoney(userId: string, amount: number, externalReference?: string): Promise<WalletTX> {
    // Vytvoř transakci
    const transaction = this.walletTxRepository.create({
      userId,
      type: TransactionType.DEPOSIT,
      amount,
      status: TransactionStatus.COMPLETED,
      description: `Vklad ${amount} EUR`,
      externalReference,
    });

    const savedTransaction = await this.walletTxRepository.save(transaction);

    // Aktualizuj zůstatek uživatele
    await this.userRepository.increment({ id: userId }, 'walletBalance', amount);

    // Pošli notifikaci
    await this.notificationsClient.createSuccessNotification(
      userId,
      'Vklad byl úspěšně proveden! 💰',
      `Na váš účet bylo připsáno ${amount} EUR`,
      `/wallet`
    );

    return savedTransaction;
  }

  async contributeToCampaign(contributorId: string, input: ContributeToCampaignInput): Promise<CampaignContribution> {
    const { campaignId, amount, message } = input;

    // Zkontroluj zůstatek
    const currentBalance = await this.getUserWalletBalance(contributorId);
    if (currentBalance < amount) {
      throw new BadRequestException('Nedostatečný zůstatek v peněžence');
    }

    // Vytvoř transakci
    const transaction = this.walletTxRepository.create({
      userId: contributorId,
      type: TransactionType.CAMPAIGN_CONTRIBUTION,
      amount,
      campaignId,
      status: TransactionStatus.COMPLETED,
      description: `Příspěvek na kampaň ${amount} EUR`,
    });

    const savedTransaction = await this.walletTxRepository.save(transaction);

    // Vytvoř příspěvek
    const contribution = this.contributionRepository.create({
      campaignId,
      contributorId,
      amount,
      message,
      walletTxId: savedTransaction.id,
    });

    const savedContribution = await this.contributionRepository.save(contribution);

    // Odečti ze zůstatku
    await this.userRepository.decrement({ id: contributorId }, 'walletBalance', amount);

    // Pošli notifikaci přispěvateli
    await this.notificationsClient.createSuccessNotification(
      contributorId,
      'Příspěvek byl odeslán! 🎯',
      `Úspěšně jste přispěli ${amount} EUR na kampaň`,
      `/campaigns/${campaignId}`
    );

    return savedContribution;
  }

  async withdrawToBank(userId: string, input: BankWithdrawalInput): Promise<WalletTX> {
    const { amount, bankAccount, description } = input;

    // Zkontroluj zůstatek
    const currentBalance = await this.getUserWalletBalance(userId);
    if (currentBalance < amount) {
      throw new BadRequestException('Nedostatečný zůstatek v peněžence');
    }

    // Vytvoř transakci
    const transaction = this.walletTxRepository.create({
      userId,
      type: TransactionType.BANK_WITHDRAWAL,
      amount,
      status: TransactionStatus.PENDING, // Výběr na banku bude vyžadovat zpracování
      description: description || `Výběr ${amount} EUR na bankovní účet`,
      externalReference: bankAccount,
    });

    const savedTransaction = await this.walletTxRepository.save(transaction);

    // Odečti ze zůstatku (dočasně, dokud se nevyřídí)
    await this.userRepository.decrement({ id: userId }, 'walletBalance', amount);

    // Pošli notifikaci
    await this.notificationsClient.createInfoNotification(
      userId,
      'Žádost o výběr byla přijata 🏦',
      `Vaše žádost o výběr ${amount} EUR byla přijata a bude zpracována do 3 pracovních dnů`,
      `/wallet`
    );

    return savedTransaction;
  }

  async refundContribution(contributionId: string, reason: string): Promise<WalletTX> {
    const contribution = await this.contributionRepository.findOne({
      where: { id: contributionId },
      relations: ['contributor', 'campaign'],
    });

    if (!contribution) {
      throw new NotFoundException('Příspěvek nebyl nalezen');
    }

    if (contribution.isRefunded) {
      throw new BadRequestException('Příspěvek již byl vrácen');
    }

    // Vytvoř refund transakci
    const refundTransaction = this.walletTxRepository.create({
      userId: contribution.contributorId,
      type: TransactionType.REFUND,
      amount: contribution.amount,
      campaignId: contribution.campaignId,
      status: TransactionStatus.COMPLETED,
      description: `Vrácení příspěvku: ${reason}`,
    });

    const savedRefund = await this.walletTxRepository.save(refundTransaction);

    // Vrať peníze na účet
    await this.userRepository.increment({ id: contribution.contributorId }, 'walletBalance', contribution.amount);

    // Označ příspěvek jako vrácený
    await this.contributionRepository.update(contributionId, { isRefunded: true });

    // Pošli notifikaci
    await this.notificationsClient.createInfoNotification(
      contribution.contributorId,
      'Příspěvek byl vrácen 💸',
      `Váš příspěvek ${contribution.amount} EUR byl vrácen zpět na váš účet. Důvod: ${reason}`,
      `/wallet`
    );

    return savedRefund;
  }

  async refundAllContributions(campaignId: string, reason: string): Promise<WalletTX[]> {
    const contributions = await this.contributionRepository.find({
      where: {
        campaignId,
        isRefunded: false
      },
      relations: ['contributor'],
    });

    const refunds: WalletTX[] = [];

    for (const contribution of contributions) {
      const refund = await this.refundContribution(contribution.id, reason);
      refunds.push(refund);
    }

    return refunds;
  }

  async completeTransaction(transactionId: string): Promise<WalletTX> {
    await this.walletTxRepository.update(transactionId, {
      status: TransactionStatus.COMPLETED
    });

    const result = await this.walletTxRepository.findOne({
      where: { id: transactionId },
      relations: ['user']
    });
    if (!result) {
      throw new NotFoundException('Transakce nebyla nalezena');
    }
    return result;
  }

  async failTransaction(transactionId: string, reason: string): Promise<WalletTX> {
    const transaction = await this.walletTxRepository.findOne({
      where: { id: transactionId },
      relations: ['user'],
    });

    if (!transaction) {
      throw new NotFoundException('Transakce nebyla nalezena');
    }

    // Pokud je to výběr na banku, vrať peníze zpět
    if (transaction.type === TransactionType.BANK_WITHDRAWAL && transaction.status === TransactionStatus.PENDING) {
      await this.userRepository.increment({ id: transaction.userId }, 'walletBalance', transaction.amount);
    }

    await this.walletTxRepository.update(transactionId, {
      status: TransactionStatus.FAILED,
      description: `${transaction.description} - Neúspěšné: ${reason}`
    });

    // Pošli notifikaci o neúspěšné transakci
    await this.notificationsClient.createErrorNotification(
      transaction.userId,
      'Transakce selhala',
      `Vaše transakce selhala: ${reason}`,
      `/wallet`
    );

    const updatedTransaction = await this.walletTxRepository.findOne({
      where: { id: transactionId },
      relations: ['user']
    });
    if (!updatedTransaction) {
      throw new NotFoundException('Transakce nebyla nalezena po aktualizaci');
    }
    return updatedTransaction;
  }
}
