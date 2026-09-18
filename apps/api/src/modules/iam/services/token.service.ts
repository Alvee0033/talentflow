import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, IsNull } from 'typeorm';
import * as crypto from 'crypto';
import { RefreshToken } from '../entities/refresh-token.entity';
import { User } from '../entities/user.entity';

export interface TokenPayload {
  sub: string;
  email: string;
  roles: string[];
  permissions: string[];
}

export interface GeneratedTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

@Injectable()
export class TokenService {
  private readonly jwtSecret: string;
  private readonly jwtAccessExpiry: string;
  private readonly jwtRefreshExpiry: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {
    this.jwtSecret =
      this.configService.get<string>('auth.jwtSecret') ||
      'dev_secret_key_for_anwar_talentflow_recruitment_system_jwt';
    this.jwtAccessExpiry = this.configService.get<string>('auth.jwtAccessExpiry') || '7d';
    this.jwtRefreshExpiry = this.configService.get<string>('auth.jwtRefreshExpiry') || '30d';
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private parseExpiryToSeconds(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 900; // default 15 minutes
    const val = parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
      case 's': return val;
      case 'm': return val * 60;
      case 'h': return val * 3600;
      case 'd': return val * 86400;
      default: return 900;
    }
  }

  async generateTokens(user: User, deviceInfo?: string): Promise<GeneratedTokens> {
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

    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      roles,
      permissions: Array.from(permissions),
    };

    const accessExpirySeconds = this.parseExpiryToSeconds(this.jwtAccessExpiry);
    const refreshExpirySeconds = this.parseExpiryToSeconds(this.jwtRefreshExpiry);

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.jwtSecret,
      expiresIn: `${accessExpirySeconds}s`,
    });

    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + refreshExpirySeconds * 1000);

    const refreshTokenEntity = this.refreshTokenRepository.create({
      userId: user.id,
      tokenHash,
      expiresAt,
      deviceInfo: deviceInfo || null,
    });

    await this.refreshTokenRepository.save(refreshTokenEntity);

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: accessExpirySeconds,
      tokenType: 'Bearer',
    };
  }

  async verifyToken(token: string): Promise<TokenPayload> {
    try {
      return await this.jwtService.verifyAsync<TokenPayload>(token, {
        secret: this.jwtSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  async validateRefreshToken(rawRefreshToken: string): Promise<RefreshToken> {
    const tokenHash = this.hashToken(rawRefreshToken);
    const storedToken = await this.refreshTokenRepository.findOne({
      where: {
        tokenHash,
        revokedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    return storedToken;
  }

  async revokeToken(rawRefreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(rawRefreshToken);
    await this.refreshTokenRepository.update(
      { tokenHash, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  async revokeUserTokens(userId: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }
}
