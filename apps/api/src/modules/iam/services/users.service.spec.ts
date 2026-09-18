import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';

describe('UsersService', () => {
  let service: UsersService;
  let userRepo: any;
  let roleRepo: any;

  const mockUser: Partial<User> = {
    id: 'user-uuid-1',
    email: 'test@talentflow.anwargroup.com',
    passwordHash: 'hashed_password',
    firstName: 'Rafiq',
    lastName: 'Ahmed',
    employeeId: 'EMP-001',
    isActive: true,
    roles: [],
  };

  beforeEach(async () => {
    userRepo = {
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation(async (user) => ({ id: 'user-uuid-1', ...user })),
      softRemove: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    roleRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Role), useValue: roleRepo },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(12),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and return a new user', async () => {
      userRepo.findOne.mockResolvedValue(null);

      const result = await service.create({
        email: 'test@talentflow.anwargroup.com',
        password: 'Password@123',
        firstName: 'Rafiq',
        lastName: 'Ahmed',
      });

      expect(result.email).toBe('test@talentflow.anwargroup.com');
      expect(userRepo.create).toHaveBeenCalled();
      expect(userRepo.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if email exists', async () => {
      userRepo.findOne.mockResolvedValue(mockUser as User);

      await expect(
        service.create({
          email: 'test@talentflow.anwargroup.com',
          password: 'Password@123',
          firstName: 'Rafiq',
          lastName: 'Ahmed',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findById', () => {
    it('should return a user if found', async () => {
      userRepo.findOne.mockResolvedValue(mockUser as User);

      const result = await service.findById('user-uuid-1');
      expect(result).toBeDefined();
      expect(result.id).toBe('user-uuid-1');
    });

    it('should throw NotFoundException if not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.findById('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });
});
