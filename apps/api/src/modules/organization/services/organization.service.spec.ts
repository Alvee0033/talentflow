import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { BusinessUnit } from '../entities/business-unit.entity';
import { Department } from '../entities/department.entity';
import { Position } from '../entities/position.entity';

describe('OrganizationService', () => {
  let service: OrganizationService;
  let buRepo: any;
  let deptRepo: any;
  let posRepo: any;

  const mockBu: Partial<BusinessUnit> = {
    id: 'bu-uuid-1',
    name: 'Anwar Galvanizing',
    code: 'AG',
    isActive: true,
  };

  beforeEach(async () => {
    buRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation(async (bu) => ({ id: 'bu-uuid-1', ...bu })),
      softRemove: jest.fn().mockResolvedValue(undefined),
    };

    deptRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation(async (dept) => ({ id: 'dept-uuid-1', ...dept })),
      softRemove: jest.fn().mockResolvedValue(undefined),
    };

    posRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation(async (pos) => ({ id: 'pos-uuid-1', ...pos })),
      softRemove: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationService,
        { provide: getRepositoryToken(BusinessUnit), useValue: buRepo },
        { provide: getRepositoryToken(Department), useValue: deptRepo },
        { provide: getRepositoryToken(Position), useValue: posRepo },
      ],
    }).compile();

    service = module.get<OrganizationService>(OrganizationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('BusinessUnit CRUD', () => {
    it('should create business unit if code and name are unique', async () => {
      buRepo.findOne.mockResolvedValue(null);

      const result = await service.createBusinessUnit({
        name: 'Anwar Galvanizing',
        code: 'AG',
      });

      expect(result.code).toBe('AG');
      expect(buRepo.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if BU code already exists', async () => {
      buRepo.findOne.mockResolvedValueOnce(mockBu as BusinessUnit);

      await expect(
        service.createBusinessUnit({ name: 'Anwar Galvanizing', code: 'AG' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should find BU by ID', async () => {
      buRepo.findOne.mockResolvedValue(mockBu as BusinessUnit);

      const result = await service.findBusinessUnitById('bu-uuid-1');
      expect(result.id).toBe('bu-uuid-1');
    });

    it('should throw NotFoundException if BU ID not found', async () => {
      buRepo.findOne.mockResolvedValue(null);

      await expect(service.findBusinessUnitById('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('Department CRUD', () => {
    it('should create department if BU exists and code is unique', async () => {
      buRepo.findOne.mockResolvedValue(mockBu as BusinessUnit);
      deptRepo.findOne.mockResolvedValue(null);

      const result = await service.createDepartment({
        name: 'Production',
        code: 'AG-PROD',
        businessUnitId: 'bu-uuid-1',
      });

      expect(result.code).toBe('AG-PROD');
      expect(deptRepo.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if parent BU does not exist', async () => {
      buRepo.findOne.mockResolvedValue(null);

      await expect(
        service.createDepartment({
          name: 'Production',
          code: 'AG-PROD',
          businessUnitId: 'missing-bu',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
