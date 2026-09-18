import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Optional } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../../modules/audit/audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(@Optional() private readonly auditService?: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle().pipe(
        tap(() => {
          const user = req.user;
          const urlSegments = req.url.split('?')[0].split('/').filter(Boolean);
          const resource = urlSegments[0] || 'unknown';
          const resourceId = urlSegments[1] || null;

          if (this.auditService) {
            this.auditService.log({
              userId: user?.id || null,
              userName: user?.firstName ? `${user.firstName} ${user.lastName}` : null,
              userRole: user?.roles?.[0]?.name || null,
              action: `${method}_${resource.toUpperCase()}`,
              resource,
              resourceId,
              details: {
                url: req.url,
                params: req.params,
                query: req.query,
              },
              ipAddress: req.ip || req.connection?.remoteAddress,
              userAgent: req.headers?.['user-agent'] || null,
            }).catch(() => {});
          }
        })
      );
    }
    return next.handle();
  }
}

