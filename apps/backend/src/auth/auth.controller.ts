import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern('generateToken')
  generateToken(@Payload() data: { email: string; userId: string; sessionId: string }) {
    return this.authService.generateToken(data.email, data.userId, data.sessionId);
  }

  @MessagePattern('createSession')
  createSession(@Payload() userId: string) {
    return this.authService.createSession(userId);
  }

  @MessagePattern('hashPassword')
  hashPassword(@Payload() password: string) {
    return this.authService.hashPassword(password);
  }

  @MessagePattern('comparePasswords')
  comparePasswords(@Payload() data: { password: string; hash: string }) {
    return this.authService.comparePasswords(data.password, data.hash);
  }

  @MessagePattern('deleteSession')
  deleteSession(@Payload() sessionId: string) {
    return this.authService.deleteSession(sessionId);
  }

  @MessagePattern('deleteAllSessions')
  deleteAllSessions(@Payload() userId: string) {
    return this.authService.deleteAllSessions(userId);
  }

  @MessagePattern('allSessions')
  allSessions(@Payload() userId: string) {
    return this.authService.allSessions(userId);
  }
}
