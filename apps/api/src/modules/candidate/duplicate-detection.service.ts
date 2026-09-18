import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Candidate } from './entities/candidate.entity';
import { CheckDuplicateDto } from './dto/check-duplicate.dto';

export interface DuplicateMatch {
  candidate: Candidate;
  matchType: 'EMAIL_EXACT' | 'PHONE_MATCH' | 'NAME_MATCH';
  confidence: number;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  hardMatch: boolean;
  matches: DuplicateMatch[];
}

@Injectable()
export class DuplicateDetectionService {
  constructor(
    @InjectRepository(Candidate)
    private readonly candidateRepo: Repository<Candidate>,
  ) {}

  async checkDuplicates(dto: CheckDuplicateDto): Promise<DuplicateCheckResult> {
    const matches: DuplicateMatch[] = [];
    let hardMatch = false;

    // 1. Hard check on email (exact match, case-insensitive)
    if (dto.email) {
      const emailTrimmed = dto.email.trim().toLowerCase();
      const emailMatch = await this.candidateRepo
        .createQueryBuilder('c')
        .where('LOWER(c.email) = :email', { email: emailTrimmed })
        .andWhere('c.isAnonymized = false')
        .getOne();

      if (emailMatch) {
        hardMatch = true;
        matches.push({
          candidate: emailMatch,
          matchType: 'EMAIL_EXACT',
          confidence: 1.0,
        });
      }
    }

    // 2. Soft check on phone
    if (dto.phone) {
      const normalizedPhone = dto.phone.replace(/[^0-9]/g, '');
      if (normalizedPhone.length >= 7) {
        const phoneCandidates = await this.candidateRepo
          .createQueryBuilder('c')
          .where('c.phone IS NOT NULL')
          .andWhere('c.isAnonymized = false')
          .getMany();

        for (const candidate of phoneCandidates) {
          if (!candidate.phone) continue;
          const candNormPhone = candidate.phone.replace(/[^0-9]/g, '');
          if (candNormPhone.length >= 7 && (candNormPhone === normalizedPhone || candNormPhone.endsWith(normalizedPhone) || normalizedPhone.endsWith(candNormPhone))) {
            if (!matches.some(m => m.candidate.id === candidate.id)) {
              matches.push({
                candidate,
                matchType: 'PHONE_MATCH',
                confidence: 0.85,
              });
            }
          }
        }
      }
    }

    // 3. Soft check on Name (first and last name match)
    if (dto.firstName && dto.lastName) {
      const first = dto.firstName.trim();
      const last = dto.lastName.trim();
      const nameMatches = await this.candidateRepo.find({
        where: {
          firstName: ILike(first),
          lastName: ILike(last),
          isAnonymized: false,
        },
      });

      for (const candidate of nameMatches) {
        if (!matches.some(m => m.candidate.id === candidate.id)) {
          matches.push({
            candidate,
            matchType: 'NAME_MATCH',
            confidence: 0.65,
          });
        }
      }
    }

    return {
      isDuplicate: matches.length > 0,
      hardMatch,
      matches,
    };
  }
}
