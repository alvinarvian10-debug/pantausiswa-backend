import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Observabilitas enterprise: catat setiap API hit (method + URL masuk,
 * status + durasi keluar) via Nest Logger terstruktur.
 *
 * Didaftarkan global di main.ts — tanpa dekorator di tiap controller.
 * Format: `METHOD /path STATUS +Xms` (error: + pesan).
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<{
      method: string;
      originalUrl?: string;
      url?: string;
    }>();
    const method = req.method;
    const url = req.originalUrl ?? req.url ?? '-';
    const started = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const status =
            context.switchToHttp().getResponse<{ statusCode: number }>()
              .statusCode;
          this.logger.log(`${method} ${url} ${status} +${Date.now() - started}ms`);
        },
        error: (err: { status?: number; message?: string }) => {
          const status = err?.status ?? 500;
          this.logger.error(
            `${method} ${url} ${status} +${Date.now() - started}ms — ${err?.message ?? 'unknown error'}`,
          );
        },
      }),
    );
  }
}
