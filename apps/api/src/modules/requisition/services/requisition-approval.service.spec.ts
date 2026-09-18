import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ApprovalStatus, RequisitionStatus } from '@talentflow/shared';
import { RequisitionApprovalService } from './requisition-approval.service';
import { RequisitionApproval } from '../entities/requisition-approval.entity';
import { Requisition } from '../entities/requisition.entity';
import { User } from '../../iam/entities/user.entity';

describe('RequisitionApprovalService', () => {
  let service: RequisitionApprovalService;
  let apprRepo: any;
  let reqRepo: any;
  let userRepo: any;

  const mockReq: Partial<Requisition> = {
    id: 'req-uuid-1',
    requisitionNumber: 'REQ-2026-0001',
    status: RequisitionStatus.DRAFT,
  };

  beforeEach(async () => {
    apprRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation(async (items) => items),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    reqRepo = {
      findOne: jest.fn().mockResolvedValue({ ...mockReq }),
      save: jest.fn().mockImplementation(async (r) => r),
    };

    userRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 'approver-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequisitionApprovalService,
        { provide: getRepositoryToken(RequisitionApproval), useValue: apprRepo },
        { provide: getRepositoryToken(Requisition), useValue: reqRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
      ],
    }).compile();

    service = module.get<RequisitionApprovalService>(RequisitionApprovalService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('submitForApproval', () => {
    it('should create approval steps and transition requisition to AWAITING_APPROVAL', async () => {
      apprRepo.find.mockResolvedValue([
        { id: 'appr-1', step: 1, status: ApprovalStatus.PENDING },
      ]);

      const result = await service.submitForApproval('req-uuid-1', ['approver-1']);

      expect(reqRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: RequisitionStatus.AWAITING_APPROVAL }),
      );
      expect(result.length).toBe(1);
    });

    it('should throw BadRequestException if approver list is empty', async () => {
      await expect(
        service.submitForApproval('req-uuid-1', []),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('approve', () => {
    it('should approve step and transition to APPROVED when final step', async () => {
      reqRepo.findOne.mockResolvedValue({
        id: 'req-uuid-1',
        status: RequisitionStatus.AWAITING_APPROVAL,
      });

      const pendingApproval = {
        id: 'appr-1',
        approverId: 'approver-1',
        step: 1,
        status: ApprovalStatus.PENDING,
      };

      apprRepo.find
        .mockResolvedValueOnce([pendingApproval])
        .mockResolvedValueOnce([{ ...pendingApproval, status: ApprovalStatus.APPROVED }]);

      const result = await service.approve('req-uuid-1', 'approver-1', 'Looks good');

      expect(reqRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: RequisitionStatus.APPROVED }),
      );
      expect(result.requisition.status).toBe(RequisitionStatus.APPROVED);
    });

    it('should throw BadRequestException if approver does not match current pending step', async () => {
      reqRepo.findOne.mockResolvedValue({
        id: 'req-uuid-1',
        status: RequisitionStatus.AWAITING_APPROVAL,
      });

      apprRepo.find.mockResolvedValue([
        {
          id: 'appr-1',
          approverId: 'different-approver',
          step: 1,
          status: ApprovalStatus.PENDING,
        },
      ]);

      await expect(
        service.approve('req-uuid-1', 'approver-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('reject', () => {
    it('should reject step and transition requisition back to DRAFT', async () => {
      reqRepo.findOne.mockResolvedValue({
        id: 'req-uuid-1',
        status: RequisitionStatus.AWAITING_APPROVAL,
      });

      const pendingApproval = {
        id: 'appr-1',
        approverId: 'approver-1',
        step: 1,
        status: ApprovalStatus.PENDING,
      };

      apprRepo.find
        .mockResolvedValueOnce([pendingApproval])
        .mockResolvedValueOnce([{ ...pendingApproval, status: ApprovalStatus.REJECTED }]);

      const result = await service.reject('req-uuid-1', 'approver-1', 'Salary too high');

      expect(reqRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: RequisitionStatus.DRAFT,
          rejectionReason: 'Salary too high',
        }),
      );
      expect(result.requisition.status).toBe(RequisitionStatus.DRAFT);
    });
  });
});
