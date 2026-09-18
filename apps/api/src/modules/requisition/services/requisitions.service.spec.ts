import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RequisitionStatus } from '@talentflow/shared';
import { RequisitionsService } from './requisitions.service';
import { Requisition } from '../entities/requisition.entity';
import { User } from '../../iam/entities/user.entity';
import { BusinessUnit } from '../../organization/entities/business-unit.entity';
import { Department } from '../../organization/entities/department.entity';
import { Position } from '../../organization/entities/position.entity';

describe('RequisitionsService', () => {
  let service: RequisitionsService;
  let reqRepo: any;
  let userRepo: any;
  let buRepo: any;
  let deptRepo: any;
  let posRepo: any;

  const mockReq: Partial<Requisition> = {
    id: 'req-uuid-1',
    requisitionNumber: 'REQ-2026-0001',
    title: 'Senior Metallurgist',
    businessUnitId: 'bu-1',
    departmentId: 'dept-1',
    status: RequisitionStatus.DRAFT,
    hiringManagerId: 'user-hm-1',
    assignedRecruiterId: null,
  };

  beforeEach(async () => {
    reqRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation(async (r) => ({ id: 'req-uuid-1', ...r })),
      softRemove: jest.fn().mockResolvedValue(undefined),
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      }),
    };

    userRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 'user-1' }),
    };

    buRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 'bu-1' }),
    };

    deptRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 'dept-1' }),
    };

    posRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 'pos-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequisitionsService,
        { provide: getRepositoryToken(Requisition), useValue: reqRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(BusinessUnit), useValue: buRepo },
        { provide: getRepositoryToken(Department), useValue: deptRepo },
        { provide: getRepositoryToken(Position), useValue: posRepo },
      ],
    }).compile();

    service = module.get<RequisitionsService>(RequisitionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateRequisitionNumber', () => {
    it('should generate REQ-YYYY-0001 when no existing requisitions', async () => {
      const year = new Date().getFullYear();
      const num = await service.generateRequisitionNumber();
      expect(num).toBe(`REQ-${year}-0001`);
    });

    it('should increment next sequence number', async () => {
      const year = new Date().getFullYear();
      reqRepo.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({
          requisitionNumber: `REQ-${year}-0042`,
        }),
      });

      const num = await service.generateRequisitionNumber();
      expect(num).toBe(`REQ-${year}-0043`);
    });
  });

  describe('status transitions', () => {
    it('should allow valid transition from DRAFT to AWAITING_APPROVAL', () => {
      expect(() =>
        service.validateStatusTransition(
          RequisitionStatus.DRAFT,
          RequisitionStatus.AWAITING_APPROVAL,
        ),
      ).not.toThrow();
    });

    it('should allow valid transition from AWAITING_APPROVAL to APPROVED', () => {
      expect(() =>
        service.validateStatusTransition(
          RequisitionStatus.AWAITING_APPROVAL,
          RequisitionStatus.APPROVED,
        ),
      ).not.toThrow();
    });

    it('should reject invalid transition from DRAFT to FILLED', () => {
      expect(() =>
        service.validateStatusTransition(
          RequisitionStatus.DRAFT,
          RequisitionStatus.FILLED,
        ),
      ).toThrow(BadRequestException);
    });

    it('should transition status and set openedAt when moving to OPEN', async () => {
      reqRepo.findOne.mockResolvedValue({
        ...mockReq,
        status: RequisitionStatus.APPROVED,
      });

      const result = await service.changeStatus('req-uuid-1', {
        status: RequisitionStatus.OPEN,
      });

      expect(result.status).toBe(RequisitionStatus.OPEN);
      expect(result.openedAt).toBeDefined();
    });
  });

  describe('assignRecruiter', () => {
    it('should assign recruiter to requisition', async () => {
      reqRepo.findOne.mockResolvedValue(mockReq);
      userRepo.findOne.mockResolvedValue({ id: 'recruiter-uuid-1' });

      const result = await service.assignRecruiter('req-uuid-1', 'recruiter-uuid-1');
      expect(result.assignedRecruiterId).toBe('recruiter-uuid-1');
    });

    it('should throw NotFoundException if recruiter does not exist', async () => {
      reqRepo.findOne.mockResolvedValue(mockReq);
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.assignRecruiter('req-uuid-1', 'missing-recruiter'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
