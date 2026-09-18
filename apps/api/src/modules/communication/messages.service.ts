import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { MessageApproval } from './entities/message-approval.entity';
import { SmtpService } from './smtp.service';
import { WhatsappService } from './whatsapp.service';
import { TemplatesService } from './templates.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { ApprovalActionDto } from './dto/create-template.dto';
import {
  MessageStatus,
  MessageChannel,
  MessageType,
  ApprovalStatus,
} from '@talentflow/shared';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @InjectRepository(MessageApproval)
    private readonly approvalRepo: Repository<MessageApproval>,
    private readonly smtpService: SmtpService,
    private readonly whatsappService: WhatsappService,
    private readonly templatesService: TemplatesService,
  ) {}

  async create(dto: CreateMessageDto, senderId?: string): Promise<Message> {
    let body = dto.body;
    let subject = dto.subject || null;

    if (dto.templateId && dto.templateData) {
      const rendered = await this.templatesService.render(dto.templateId, dto.templateData);
      body = rendered.body;
      if (rendered.subject) {
        subject = rendered.subject;
      }
    }

    // Safety rule assertion during drafting/creation
    this.assertSafeForCandidate(body, subject);

    let recipientEmail = dto.recipientEmail || null;
    let recipientPhone = dto.recipientPhone || null;

    if ((!recipientEmail || !recipientPhone) && dto.candidateId) {
      try {
        const cand = await this.messageRepo.manager.query(
          'SELECT email, phone FROM candidates WHERE id = $1',
          [dto.candidateId],
        );
        if (cand && cand[0]) {
          if (!recipientEmail) recipientEmail = cand[0].email;
          if (!recipientPhone) recipientPhone = cand[0].phone;
        }
      } catch {
        // ignore
      }
    }

    const message = this.messageRepo.create({
      candidateId: dto.candidateId,
      applicationId: dto.applicationId || null,
      channel: dto.channel || MessageChannel.EMAIL,
      type: dto.type || MessageType.INTERVIEW_INVITATION,
      subject,
      body,
      recipientEmail,
      recipientPhone,
      status: MessageStatus.DRAFTED,
      senderId: senderId || null,
    });

    return await this.messageRepo.save(message);
  }

  async requestApproval(id: string): Promise<Message> {
    const message = await this.findById(id);

    if (message.status === MessageStatus.SENT || message.status === MessageStatus.DELIVERED) {
      throw new BadRequestException('Message has already been sent');
    }

    this.assertSafeForCandidate(message.body, message.subject);

    message.status = MessageStatus.AWAITING_APPROVAL;
    await this.messageRepo.save(message);

    const approval = this.approvalRepo.create({
      messageId: message.id,
      status: ApprovalStatus.PENDING,
    });
    await this.approvalRepo.save(approval);

    return this.findById(id);
  }

  async approve(id: string, approverId: string, dto?: ApprovalActionDto): Promise<Message> {
    const message = await this.findById(id);

    if (message.status !== MessageStatus.AWAITING_APPROVAL) {
      throw new BadRequestException(`Cannot approve message in ${message.status} status`);
    }

    this.assertSafeForCandidate(message.body, message.subject);

    message.status = MessageStatus.APPROVED;
    await this.messageRepo.save(message);

    const pendingApproval = await this.approvalRepo.findOne({
      where: { messageId: id, status: ApprovalStatus.PENDING },
      order: { createdAt: 'DESC' },
    });

    if (pendingApproval) {
      pendingApproval.status = ApprovalStatus.APPROVED;
      pendingApproval.approverId = approverId;
      pendingApproval.comments = dto?.comments || dto?.notes || dto?.reason || null;
      pendingApproval.decidedAt = new Date();
      await this.approvalRepo.save(pendingApproval);
    }

    return this.findById(id);
  }

  async reject(id: string, approverId: string, dto?: ApprovalActionDto): Promise<Message> {
    const message = await this.findById(id);

    message.status = MessageStatus.DRAFTED;
    await this.messageRepo.save(message);

    const pendingApproval = await this.approvalRepo.findOne({
      where: { messageId: id, status: ApprovalStatus.PENDING },
      order: { createdAt: 'DESC' },
    });

    if (pendingApproval) {
      pendingApproval.status = ApprovalStatus.REJECTED;
      pendingApproval.approverId = approverId;
      pendingApproval.comments = dto?.comments || dto?.notes || dto?.reason || null;
      pendingApproval.decidedAt = new Date();
      await this.approvalRepo.save(pendingApproval);
    }

    return this.findById(id);
  }

  /**
   * CRITICAL RULES:
   * 1. Messages must be approved (status === APPROVED) before sending!
   * 2. Internal notes and rejection reasons must NEVER appear in candidate messages.
   */
  async send(id: string): Promise<Message> {
    const message = await this.findById(id);

    // Rule 1: Approval Gate Check
    if (message.status !== MessageStatus.APPROVED) {
      throw new BadRequestException(
        `Message must be approved before sending! Current status: ${message.status}`,
      );
    }

    // Rule 2: Safety Check for sensitive internal data leakage
    this.assertSafeForCandidate(message.body, message.subject);

    try {
      let targetEmail = message.recipientEmail;
      let targetPhone = message.recipientPhone;

      if ((!targetEmail || !targetPhone) && message.candidateId) {
        try {
          const cand = await this.messageRepo.manager.query(
            'SELECT email, phone FROM candidates WHERE id = $1',
            [message.candidateId],
          );
          if (cand && cand[0]) {
            if (!targetEmail) targetEmail = cand[0].email;
            if (!targetPhone) targetPhone = cand[0].phone;
          }
        } catch {
          // ignore
        }
      }

      if (message.channel === MessageChannel.EMAIL) {
        const to = targetEmail || 'candidate@talentflow.anwargroup.com';
        await this.smtpService.sendMail({
          to,
          subject: message.subject || 'Message from TalentFlow',
          html: message.body,
        });
        message.recipientEmail = to;
      } else if (message.channel === MessageChannel.WHATSAPP) {
        const to = targetPhone || '+8801700000000';
        await this.whatsappService.sendMessage({
          to,
          body: message.body,
        });
        message.recipientPhone = to;
      }

      message.status = MessageStatus.SENT;
      message.sentAt = new Date();
      message.error = null;
    } catch (err: any) {
      message.status = MessageStatus.FAILED;
      message.error = err.message || 'Failed to dispatch message';
    }

    return await this.messageRepo.save(message);
  }

  async findAll(params: {
    candidateId?: string;
    applicationId?: string;
    status?: MessageStatus;
    channel?: MessageChannel;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const qb = this.messageRepo.createQueryBuilder('m')
      .leftJoinAndSelect('m.approvals', 'approvals')
      .leftJoinAndSelect('approvals.approver', 'approver')
      .orderBy('m.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (params.candidateId) {
      qb.andWhere('m.candidateId = :candidateId', { candidateId: params.candidateId });
    }
    if (params.applicationId) {
      qb.andWhere('m.applicationId = :applicationId', { applicationId: params.applicationId });
    }
    if (params.status) {
      qb.andWhere('m.status = :status', { status: params.status });
    }
    if (params.channel) {
      qb.andWhere('m.channel = :channel', { channel: params.channel });
    }

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string): Promise<Message> {
    const message = await this.messageRepo.findOne({
      where: { id },
      relations: ['approvals', 'approvals.approver'],
    });

    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }
    return message;
  }

  /**
   * Safety filter to guarantee internal notes, internal scores,
   * and raw rejection reasons are NEVER leaked to candidates.
   */
  private assertSafeForCandidate(body: string, subject?: string | null): void {
    const fullText = `${subject || ''} ${body}`.toLowerCase();

    const leakPatterns = [
      'rejection_reason',
      'rejectionreason',
      'internal note',
      'internal_note',
      '[internal]',
      'confidential note',
      'interview score',
      'evaluation score',
      'salary benchmark',
      'hiring manager comment',
      'panel deliberation',
      'do not share with candidate',
    ];

    for (const pattern of leakPatterns) {
      if (fullText.includes(pattern)) {
        throw new BadRequestException(
          `Security Violation: Internal notes or internal rejection details ('${pattern}') cannot be exposed in candidate messages`,
        );
      }
    }
  }
}
