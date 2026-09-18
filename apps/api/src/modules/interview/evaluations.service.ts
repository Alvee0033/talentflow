import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Evaluation } from './entities/evaluation.entity';
import { Interview } from './entities/interview.entity';
import { SubmitEvaluationDto } from './dto/submit-evaluation.dto';
import { SystemRole } from '@talentflow/shared';

@Injectable()
export class EvaluationsService {
  constructor(
    @InjectRepository(Evaluation)
    private readonly evaluationRepo: Repository<Evaluation>,
    @InjectRepository(Interview)
    private readonly interviewRepo: Repository<Interview>,
  ) {}

  async saveOrSubmit(dto: SubmitEvaluationDto, panelistId: string): Promise<Evaluation> {
    const interview = await this.interviewRepo.findOne({ where: { id: dto.interviewId } });
    if (!interview) {
      throw new NotFoundException(`Interview with ID ${dto.interviewId} not found`);
    }

    let evaluation = await this.evaluationRepo.findOne({
      where: { interviewId: dto.interviewId, panelistId },
    });

    const isSubmitted = dto.isSubmitted !== undefined ? dto.isSubmitted : true;

    if (!evaluation) {
      evaluation = this.evaluationRepo.create({
        interviewId: dto.interviewId,
        panelistId,
        recommendation: dto.recommendation,
        overallScore: dto.overallScore,
        criteriaRatings: dto.criteriaRatings || null,
        strengths: dto.strengths || null,
        areasOfImprovement: dto.areasOfImprovement || null,
        generalNotes: dto.generalNotes || null,
        isSubmitted,
        submittedAt: isSubmitted ? new Date() : null,
      });
    } else {
      evaluation.recommendation = dto.recommendation;
      evaluation.overallScore = dto.overallScore;
      if (dto.criteriaRatings !== undefined) evaluation.criteriaRatings = dto.criteriaRatings;
      if (dto.strengths !== undefined) evaluation.strengths = dto.strengths;
      if (dto.areasOfImprovement !== undefined) evaluation.areasOfImprovement = dto.areasOfImprovement;
      if (dto.generalNotes !== undefined) evaluation.generalNotes = dto.generalNotes;
      evaluation.isSubmitted = isSubmitted;
      if (isSubmitted && !evaluation.submittedAt) {
        evaluation.submittedAt = new Date();
      }
    }

    return await this.evaluationRepo.save(evaluation);
  }

  /**
   * CRITICAL BUSINESS RULE:
   * Panel members CANNOT see other interviewers' evaluations until they have submitted their own!
   * Consolidated view only returns all evaluations once the requesting panelist has submitted,
   * or if user is Recruiter / TA Admin.
   */
  async getInterviewEvaluations(interviewId: string, currentUser: any): Promise<Evaluation[]> {
    const interview = await this.interviewRepo.findOne({ where: { id: interviewId } });
    if (!interview) {
      throw new NotFoundException(`Interview with ID ${interviewId} not found`);
    }

    const isPrivileged = this.hasPrivilegedAccess(currentUser);

    if (isPrivileged) {
      return await this.evaluationRepo.find({
        where: { interviewId },
        relations: ['panelist'],
      });
    }

    // Panel member flow:
    // Check if requesting user has submitted their own evaluation
    const userEvaluation = await this.evaluationRepo.findOne({
      where: { interviewId, panelistId: currentUser.id },
      relations: ['panelist'],
    });

    if (userEvaluation && userEvaluation.isSubmitted) {
      // User has submitted their own evaluation, can see all submitted evaluations
      return await this.evaluationRepo.find({
        where: { interviewId, isSubmitted: true },
        relations: ['panelist'],
      });
    }

    // User has NOT submitted their evaluation.
    // They can ONLY see their own draft evaluation if it exists, otherwise empty.
    if (userEvaluation) {
      return [userEvaluation];
    }

    return [];
  }

  async findById(id: string, currentUser: any): Promise<Evaluation> {
    const evaluation = await this.evaluationRepo.findOne({
      where: { id },
      relations: ['panelist', 'interview'],
    });

    if (!evaluation) {
      throw new NotFoundException(`Evaluation with ID ${id} not found`);
    }

    const isPrivileged = this.hasPrivilegedAccess(currentUser);
    if (isPrivileged || evaluation.panelistId === currentUser.id) {
      return evaluation;
    }

    // Check if current user has submitted evaluation for this interview
    const userEval = await this.evaluationRepo.findOne({
      where: { interviewId: evaluation.interviewId, panelistId: currentUser.id },
    });

    if (!userEval || !userEval.isSubmitted) {
      throw new ForbiddenException(
        'Blind evaluation rule: You cannot view this evaluation until you submit your own.',
      );
    }

    return evaluation;
  }

  private hasPrivilegedAccess(currentUser: any): boolean {
    if (!currentUser) return false;
    const privilegedRoles = [
      SystemRole.TA_ADMIN,
      SystemRole.RECRUITER,
      SystemRole.HR_LEADERSHIP,
      SystemRole.TECH_ADMIN,
    ];

    const userRoles: string[] = Array.isArray(currentUser.roles)
      ? currentUser.roles.map((r: any) => (typeof r === 'string' ? r : r.name))
      : currentUser.role ? [currentUser.role] : [];

    return userRoles.some(role => privilegedRoles.includes(role as SystemRole));
  }
}
