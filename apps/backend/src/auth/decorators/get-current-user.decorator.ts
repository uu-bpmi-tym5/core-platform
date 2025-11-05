import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { JwtPayload } from '../auth.service';

export const GetCurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtPayload | undefined;
    return data ? (user ? user[data] : undefined) : user;
  },
);
