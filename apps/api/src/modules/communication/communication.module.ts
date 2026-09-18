import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { MessageTemplate } from './entities/message-template.entity';
import { MessageApproval } from './entities/message-approval.entity';
import { MessagesService } from './messages.service';
import { TemplatesService } from './templates.service';
import { SmtpService } from './smtp.service';
import { WhatsappService } from './whatsapp.service';
import { MessagesController } from './messages.controller';
import { TemplatesController } from './templates.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Message,
      MessageTemplate,
      MessageApproval,
    ]),
  ],
  controllers: [
    MessagesController,
    TemplatesController,
  ],
  providers: [
    MessagesService,
    TemplatesService,
    SmtpService,
    WhatsappService,
  ],
  exports: [
    MessagesService,
    TemplatesService,
    SmtpService,
    WhatsappService,
    TypeOrmModule,
  ],
})
export class CommunicationModule {}
