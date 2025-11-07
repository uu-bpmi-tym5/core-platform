import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { JwtPayload } from '../auth.service';

export const GetCurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    let request;
    try {
      const gqlCtx = GqlExecutionContext.create(ctx);
      request = gqlCtx.getContext().req;
    } catch {
      request = ctx.switchToHttp().getRequest();
    }

    const user = request.user as JwtPayload | undefined;
    return data ? (user ? user[data] : undefined) : user;
  },
);
