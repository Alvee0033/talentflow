import { Injectable, Logger } from '@nestjs/common';

export interface SendWhatsAppOptions {
  to: string;
  body: string;
}

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  async sendMessage(options: SendWhatsAppOptions): Promise<{ success: boolean; messageId: string }> {
    // WhatsApp stub / integration layer
    this.logger.log(`[WhatsApp Stub] Dispatching to ${options.to}: ${options.body.substring(0, 50)}...`);
    return {
      success: true,
      messageId: `wa-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    };
  }
}
