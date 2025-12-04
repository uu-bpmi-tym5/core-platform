import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { Role } from '../auth/enums';

@Injectable()
export class SeederService implements OnModuleInit {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    @Inject('USER_REPOSITORY')
    private readonly userRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    await this.seedAdminUser();
  }

  private async seedAdminUser() {
    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@platform.local';
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
    const adminName = process.env.DEFAULT_ADMIN_NAME || 'Platform Admin';

    // Check if an admin user already exists
    const existingAdmin = await this.userRepository.findOne({
      where: { role: Role.ADMIN },
    });

    if (existingAdmin) {
      this.logger.log(`Admin user already exists: ${existingAdmin.email}`);
      return;
    }

    // Check if user with admin email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: adminEmail },
    });

    if (existingUser) {
      // Upgrade existing user to admin
      existingUser.role = Role.ADMIN;
      await this.userRepository.save(existingUser);
      this.logger.log(`Upgraded existing user to admin: ${adminEmail}`);
      return;
    }

    // Create new admin user
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

    const adminUser = this.userRepository.create({
      email: adminEmail,
      password: hashedPassword,
      name: adminName,
      role: Role.ADMIN,
    });

    await this.userRepository.save(adminUser);
    this.logger.log(`Created default admin user: ${adminEmail}`);
    this.logger.warn(
      'SECURITY WARNING: Please change the default admin password immediately!',
    );
  }
}

