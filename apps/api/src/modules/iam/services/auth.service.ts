import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { TokenService, GeneratedTokens } from './token.service';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { User } from '../entities/user.entity';

export interface AuthResponse extends GeneratedTokens {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    employeeId: string | null;
    phone: string | null;
    departmentId: string | null;
    roles: string[];
    permissions: string[];
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
  ) {}

  async validateUser(email: string, pass: string): Promise<Omit<User, 'passwordHash'> | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return null;
    }

    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) {
      return null;
    }

    const { passwordHash, ...result } = user;
    return result as Omit<User, 'passwordHash'>;
  }

  private buildUserPayload(user: User) {
    const permissions = new Set<string>();
    const roles: string[] = [];

    if (user.roles) {
      for (const role of user.roles) {
        roles.push(role.name);
        if (role.permissions) {
          for (const perm of role.permissions) {
            permissions.add(perm.name);
          }
        }
      }
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      employeeId: user.employeeId,
      phone: user.phone,
      departmentId: user.departmentId,
      roles,
      permissions: Array.from(permissions),
    };
  }

  async login(dto: LoginDto, deviceInfo?: string): Promise<AuthResponse> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your account has been deactivated');
    }

    await this.usersService.updateLastLogin(user.id);
    const tokens = await this.tokenService.generateTokens(user, deviceInfo);

    return {
      ...tokens,
      user: this.buildUserPayload(user),
    };
  }

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException(`User with email '${dto.email}' already exists`);
    }

    const user = await this.usersService.create(dto);
    const tokens = await this.tokenService.generateTokens(user);

    return {
      ...tokens,
      user: this.buildUserPayload(user),
    };
  }

  async refreshToken(rawRefreshToken: string, deviceInfo?: string): Promise<GeneratedTokens> {
    const storedToken = await this.tokenService.validateRefreshToken(rawRefreshToken);
    const user = await this.usersService.findById(storedToken.userId);

    if (!user.isActive) {
      throw new UnauthorizedException('User account is deactivated');
    }

    // Revoke previous token (token rotation)
    await this.tokenService.revokeToken(rawRefreshToken);

    // Generate new token pair
    return this.tokenService.generateTokens(user, deviceInfo);
  }

  async logout(userId: string, rawRefreshToken?: string): Promise<{ message: string }> {
    if (rawRefreshToken) {
      await this.tokenService.revokeToken(rawRefreshToken);
    } else {
      await this.tokenService.revokeUserTokens(userId);
    }
    return { message: 'Successfully logged out' };
  }

  async getMe(userId: string) {
    const user = await this.usersService.findById(userId);
    return this.buildUserPayload(user);
  }
}
