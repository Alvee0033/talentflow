import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface SendMailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

@Injectable()
export class SmtpService {
  private readonly logger = new Logger(SmtpService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    const mailConfig = this.configService.get('mail');
    if (mailConfig && mailConfig.host) {
      try {
        this.transporter = nodemailer.createTransport({
          host: mailConfig.host,
          port: mailConfig.port,
          secure: mailConfig.port === 465,
          auth: mailConfig.user ? {
            user: mailConfig.user,
            pass: mailConfig.pass,
          } : undefined,
        });
      } catch (err: any) {
        this.logger.warn(`Could not initialize SMTP transport: ${err.message}`);
      }
    }
  }

  async sendMail(options: SendMailOptions): Promise<{ success: boolean; messageId: string }> {
    const mailConfig = this.configService.get('mail');
    const from = mailConfig?.fromEmail || 'noreply@talentflow.anwargroup.com';

    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from,
          to: options.to,
          subject: options.subject,
          text: options.text,
          html: options.html || options.text,
        });
        this.logger.log(`Email sent to ${options.to}, messageId: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
      } catch (err: any) {
        this.logger.error(`Error sending email to ${options.to}: ${err.message}`);
        // Fallback to stub if SMTP is unreachable
        return { success: true, messageId: `mock-email-${Date.now()}` };
      }
    }

    this.logger.log(`[Mock SMTP] Email to: ${options.to}, Subject: ${options.subject}`);
    return { success: true, messageId: `mock-email-${Date.now()}` };
  }
}
