import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { APP_GUARD } from '@nestjs/core';
import { IamModule } from './modules/iam/iam.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { RequisitionModule } from './modules/requisition/requisition.module';
import { CandidateModule } from './modules/candidate/candidate.module';
import { InterviewModule } from './modules/interview/interview.module';
import { CommunicationModule } from './modules/communication/communication.module';
import { TaskModule } from './modules/task/task.module';
import { JoiningModule } from './modules/joining/joining.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ReportingModule } from './modules/reporting/reporting.module';
import { DocumentModule } from './modules/document/document.module';
import { ApprovalModule } from './modules/approval/approval.module';
import { AuditModule } from './modules/audit/audit.module';
import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';
import storageConfig from './config/storage.config';
import mailConfig from './config/mail.config';
import authConfig from './config/auth.config';
import appConfig from './config/app.config';
import { configValidationSchema } from './config/config.validation';
import { RedisCacheModule } from './common/cache/redis-cache.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
      load: [databaseConfig, redisConfig, storageConfig, mailConfig, authConfig, appConfig],
      validationSchema: configValidationSchema
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => configService.get<any>('database')!,
    }),
    ThrottlerModule.forRoot([{
      ttl: 60,
      limit: 100
    }]),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: configService.get('redis')
      })
    }),
    IamModule,
    OrganizationModule,
    RequisitionModule,
    CandidateModule,
    InterviewModule,
    CommunicationModule,
    TaskModule,
    JoiningModule,
    DashboardModule,
    RedisCacheModule,
    ReportingModule,
    DocumentModule,
    ApprovalModule,
    AuditModule
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
