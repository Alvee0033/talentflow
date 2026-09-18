import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { TokenService } from './token.service';
import { User } from '../entities/user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: any;
  let tokenService: any;

  const mockUser: Partial<User> = {
    id: 'user-1',
    email: 'test@talentflow.anwargroup.com',
    passwordHash: '$2b$12$eXampleHashedPasswordStringHere',
    firstName: 'Test',
    lastName: 'User',
    employeeId: 'EMP-001',
    phone: null,
    departmentId: null,
    isActive: true,
    roles: [],
  };

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      updateLastLogin: jest.fn(),
    };

    tokenService = {
      generateTokens: jest.fn().mockResolvedValue({
        accessToken: 'mock.access.token',
        refreshToken: 'mock.refresh.token',
        expiresIn: 900,
        tokenType: 'Bearer',
      }),
      validateRefreshToken: jest.fn(),
      revokeToken: jest.fn(),
      revokeUserTokens: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: TokenService, useValue: tokenService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user without passwordHash when credentials match', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as User);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);

      const result = await service.validateUser('test@talentflow.anwargroup.com', 'validPass');
      expect(result).toBeDefined();
      expect(result?.email).toBe(mockUser.email);
      expect((result as any).passwordHash).toBeUndefined();
    });

    it('should return null when password does not match', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as User);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => false);

      const result = await service.validateUser('test@talentflow.anwargroup.com', 'wrongPass');
      expect(result).toBeNull();
    });

    it('should return null when user is not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser('notfound@anwargroup.com', 'pass');
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should authenticate user and return tokens', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as User);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);

      const result = await service.login({
        email: 'test@talentflow.anwargroup.com',
        password: 'ValidPassword123',
      });

      expect(result.accessToken).toBe('mock.access.token');
      expect(result.user.email).toBe(mockUser.email);
      expect(usersService.updateLastLogin).toHaveBeenCalledWith('user-1');
      expect(tokenService.generateTokens).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if password is wrong', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as User);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => false);

      await expect(
        service.login({ email: 'test@talentflow.anwargroup.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user is deactivated', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      usersService.findByEmail.mockResolvedValue(inactiveUser as User);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);

      await expect(
        service.login({ email: 'test@talentflow.anwargroup.com', password: 'pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should create new user and return tokens', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue(mockUser as User);

      const result = await service.register({
        email: 'test@talentflow.anwargroup.com',
        password: 'ValidPassword123',
        firstName: 'Test',
        lastName: 'User',
      });

      expect(result.accessToken).toBe('mock.access.token');
      expect(usersService.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if user already exists', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as User);

      await expect(
        service.register({
          email: 'test@talentflow.anwargroup.com',
          password: 'ValidPassword123',
          firstName: 'Test',
          lastName: 'User',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('logout', () => {
    it('should revoke token and return success', async () => {
      const result = await service.logout('user-1', 'raw-token');
      expect(tokenService.revokeToken).toHaveBeenCalledWith('raw-token');
      expect(result.message).toBe('Successfully logged out');
    });
  });
});
