import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApprovalStatus, RequisitionStatus } from '@talentflow/shared';
import { RequisitionApproval } from '../entities/requisition-approval.entity';
import { Requisition } from '../entities/requisition.entity';
import { User } from '../../iam/entities/user.entity';

@Injectable()
export class RequisitionApprovalService {
  constructor(
    @InjectRepository(RequisitionApproval)
    private readonly approvalRepository: Repository<RequisitionApproval>,
    @InjectRepository(Requisition)
    private readonly requisitionRepository: Repository<Requisition>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async submitForApproval(
    requisitionId: string,
    approverIds: string[],
    notes?: string,
  ): Promise<RequisitionApproval[]> {
    const requisition = await this.requisitionRepository.findOne({
      where: { id: requisitionId },
    });
    if (!requisition) {
      throw new NotFoundException(`Requisition with ID '${requisitionId}' not found`);
    }

    if (
      requisition.status !== RequisitionStatus.DRAFT &&
      requisition.status !== RequisitionStatus.AWAITING_APPROVAL
    ) {
      throw new BadRequestException(
        `Requisition cannot be submitted for approval in '${requisition.status}' status`,
      );
    }

    if (!approverIds || approverIds.length === 0) {
      throw new BadRequestException('At least one approver must be designated');
    }

    // Validate all approvers exist
    for (const approverId of approverIds) {
      const user = await this.userRepository.findOne({ where: { id: approverId } });
      if (!user) {
        throw new BadRequestException(`Approver with ID '${approverId}' not found`);
      }
    }

    // Remove any existing approvals if resubmitting from draft
    await this.approvalRepository.delete({ requisitionId });

    // Create approval chain
    const approvals: RequisitionApproval[] = [];
    for (let i = 0; i < approverIds.length; i++) {
      const approval = this.approvalRepository.create({
        requisitionId,
        approverId: approverIds[i],
        step: i + 1,
        status: ApprovalStatus.PENDING,
        comments: i === 0 && notes ? `Submission notes: ${notes}` : null,
      });
      approvals.push(approval);
    }

    await this.approvalRepository.save(approvals);

    // Transition requisition status to AWAITING_APPROVAL
    requisition.status = RequisitionStatus.AWAITING_APPROVAL;
    requisition.rejectionReason = null;
    await this.requisitionRepository.save(requisition);

    return this.approvalRepository.find({
      where: { requisitionId },
      relations: ['approver'],
      order: { step: 'ASC' },
    });
  }

  async approve(
    requisitionId: string,
    approverId: string,
    comments?: string,
  ): Promise<{ requisition: Requisition; approvals: RequisitionApproval[] }> {
    const requisition = await this.requisitionRepository.findOne({
      where: { id: requisitionId },
    });
    if (!requisition) {
      throw new NotFoundException(`Requisition with ID '${requisitionId}' not found`);
    }

    if (requisition.status !== RequisitionStatus.AWAITING_APPROVAL) {
      throw new BadRequestException(
        `Requisition is not awaiting approval (current status: '${requisition.status}')`,
      );
    }

    const approvals = await this.approvalRepository.find({
      where: { requisitionId },
      order: { step: 'ASC' },
    });

    if (!approvals.length) {
      throw new BadRequestException('No approval steps found for this requisition');
    }

    // Find first pending approval step
    const currentPendingStep = approvals.find(
      (a) => a.status === ApprovalStatus.PENDING,
    );

    if (!currentPendingStep) {
      throw new BadRequestException('All approval steps have already been decided');
    }

    // Check if the current user is the approver for this step
    if (currentPendingStep.approverId !== approverId) {
      throw new BadRequestException(
        'You are not authorized to approve the current pending step in this workflow',
      );
    }

    // Mark step as approved
    currentPendingStep.status = ApprovalStatus.APPROVED;
    currentPendingStep.actionDate = new Date();
    currentPendingStep.comments = comments || null;
    await this.approvalRepository.save(currentPendingStep);

    // Check if there are any remaining pending steps
    const remainingPending = approvals.some(
      (a) => a.id !== currentPendingStep.id && a.status === ApprovalStatus.PENDING,
    );

    if (!remainingPending) {
      requisition.status = RequisitionStatus.APPROVED;
      await this.requisitionRepository.save(requisition);
    }

    const updatedApprovals = await this.approvalRepository.find({
      where: { requisitionId },
      relations: ['approver'],
      order: { step: 'ASC' },
    });

    return { requisition, approvals: updatedApprovals };
  }

  async reject(
    requisitionId: string,
    approverId: string,
    reason: string,
  ): Promise<{ requisition: Requisition; approvals: RequisitionApproval[] }> {
    const requisition = await this.requisitionRepository.findOne({
      where: { id: requisitionId },
    });
    if (!requisition) {
      throw new NotFoundException(`Requisition with ID '${requisitionId}' not found`);
    }

    if (requisition.status !== RequisitionStatus.AWAITING_APPROVAL) {
      throw new BadRequestException(
        `Requisition is not awaiting approval (current status: '${requisition.status}')`,
      );
    }

    const approvals = await this.approvalRepository.find({
      where: { requisitionId },
      order: { step: 'ASC' },
    });

    const currentPendingStep = approvals.find(
      (a) => a.status === ApprovalStatus.PENDING,
    );

    if (!currentPendingStep) {
      throw new BadRequestException('No pending approval step to reject');
    }

    if (currentPendingStep.approverId !== approverId) {
      throw new BadRequestException(
        'You are not authorized to act on the current pending step in this workflow',
      );
    }

    // Mark step as rejected
    currentPendingStep.status = ApprovalStatus.REJECTED;
    currentPendingStep.actionDate = new Date();
    currentPendingStep.comments = reason;
    await this.approvalRepository.save(currentPendingStep);

    // Return requisition back to DRAFT with rejection reason
    requisition.status = RequisitionStatus.DRAFT;
    requisition.rejectionReason = reason;
    await this.requisitionRepository.save(requisition);

    const updatedApprovals = await this.approvalRepository.find({
      where: { requisitionId },
      relations: ['approver'],
      order: { step: 'ASC' },
    });

    return { requisition, approvals: updatedApprovals };
  }

  async getApprovals(requisitionId: string): Promise<RequisitionApproval[]> {
    return this.approvalRepository.find({
      where: { requisitionId },
      relations: ['approver'],
      order: { step: 'ASC' },
    });
  }
}
