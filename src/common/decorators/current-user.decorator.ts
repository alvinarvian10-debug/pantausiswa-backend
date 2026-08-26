import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface RequestUser {
  userId: number;
  email: string;
  role: 'ADMIN' | 'GURU' | 'SISWA';
}

export const CurrentUser = createParamDecorator(
  (data: keyof RequestUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: RequestUser = request.user;
    return data ? user?.[data] : user;
  },
);
