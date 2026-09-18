import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between } from 'typeorm';
import { Requisition } from '../requisition/entities/requisition.entity';
import { Application } from '../candidate/entities/application.entity';
import { Candidate } from '../candidate/entities/candidate.entity';
import { Interview } from '../interview/entities/interview.entity';
import { Evaluation } from '../interview/entities/evaluation.entity';
import { Task } from '../task/entities/task.entity';
import { JoiningChecklist } from '../joining/entities/joining-checklist.entity';
import { Department } from '../organization/entities/department.entity';
import {
  ApplicationStage,
  InterviewStatus,
  RequisitionStatus,
  TaskStatus,
  STAGE_ORDER,
} from '@talentflow/shared';
import { RedisCacheService } from '../../common/cache/redis-cache.service';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Requisition)
    private readonly reqRepo: Repository<Requisition>,
    @InjectRepository(Application)
    private readonly appRepo: Repository<Application>,
    @InjectRepository(Candidate)
    private readonly candRepo: Repository<Candidate>,
    @InjectRepository(Interview)
    private readonly interviewRepo: Repository<Interview>,
    @InjectRepository(Evaluation)
    private readonly evaluationRepo: Repository<Evaluation>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(JoiningChecklist)
    private readonly joiningRepo: Repository<JoiningChecklist>,
    @InjectRepository(Department)
    private readonly deptRepo: Repository<Department>,
    private readonly cache: RedisCacheService,
  ) {}

  /**
   * Recruiter Dashboard
   */
  async getRecruiterDashboard(recruiterId: string) {
    return this.cache.wrap(`dashboard:recruiter:${recruiterId}`, 60, async () => {
      // 1. Requisitions assigned to this recruiter
      const requisitions = await this.reqRepo.find({
        where: [
          { assignedRecruiterId: recruiterId, status: RequisitionStatus.OPEN },
          { assignedRecruiterId: recruiterId, status: RequisitionStatus.APPROVED },
        ],
        relations: ['department'],
      });

      const reqIds = requisitions.map((r) => r.id);

      // 2. Applications for these requisitions
      let applications: Application[] = [];
      if (reqIds.length > 0) {
        applications = await this.appRepo.find({
          where: { requisitionId: In(reqIds) },
          relations: ['candidate', 'requisition'],
        });
      }

      // 3. Stage breakdown (Pipeline Funnel)
      const stageCounts: Record<string, number> = {};
      for (const stage of STAGE_ORDER) {
        stageCounts[stage] = 0;
      }
      for (const app of applications) {
        if (stageCounts[app.stage] !== undefined) {
          stageCounts[app.stage]++;
        }
      }

      // 4. Upcoming interviews
      let upcomingInterviews: any[] = [];
      if (applications.length > 0) {
        const appIds = applications.map((a) => a.id);
        const interviews = await this.interviewRepo.find({
          where: {
            applicationId: In(appIds),
            status: InterviewStatus.SCHEDULED,
          },
          relations: ['application', 'application.candidate', 'panelists', 'panelists.user'],
          order: { scheduledStartTime: 'ASC' },
          take: 5,
        });

        upcomingInterviews = interviews.map((i) => ({
          id: i.id,
          candidateName: `${i.application?.candidate?.firstName || ''} ${i.application?.candidate?.lastName || ''}`.trim(),
          title: i.title,
          roundNumber: i.roundNumber,
          scheduledStartTime: i.scheduledStartTime,
          scheduledEndTime: i.scheduledEndTime,
          location: i.location,
          meetingLink: i.meetingLink,
          panelists: (i.panelists || []).map((p) => `${p.user?.firstName || ''} ${p.user?.lastName || ''}`.trim()),
        }));
      }

      // 5. Pending tasks & SLA overdue
      const pendingTasks = await this.taskRepo.find({
        where: {
          assigneeId: recruiterId,
          status: In([TaskStatus.OPEN, TaskStatus.IN_PROGRESS]),
        },
        order: { dueDate: 'ASC' },
        take: 10,
      });

      // 6. Action items requiring attention
      const actionItems = [];
      const overdueTasksCount = pendingTasks.filter(
        (t) => t.dueDate && new Date(t.dueDate) < new Date()
      ).length;

      if (overdueTasksCount > 0) {
        actionItems.push({
          type: 'OVERDUE_TASKS',
          message: `You have ${overdueTasksCount} overdue tasks requiring immediate action`,
          severity: 'HIGH',
        });
      }

      const feedbackPendingCount = stageCounts[ApplicationStage.FEEDBACK_PENDING] || 0;
      if (feedbackPendingCount > 0) {
        actionItems.push({
          type: 'FEEDBACK_PENDING',
          message: `${feedbackPendingCount} candidates are awaiting panel evaluation feedback`,
          severity: 'MEDIUM',
        });
      }

      return {
        activeRequisitionsCount: requisitions.length,
        activeCandidatesCount: applications.length,
        requisitions: requisitions.map((r) => ({
          id: r.id,
          requisitionNumber: r.requisitionNumber,
          title: r.title,
          department: r.department?.name || 'N/A',
          status: r.status,
          headcount: r.headcount,
        })),
        pipelineByStage: stageCounts,
        upcomingInterviews,
        pendingTasks,
        actionItems,
      };
    });
  }

  /**
   * TA Head Dashboard (Organization-wide metrics)
   */
  async getTaHeadDashboard() {
    return this.cache.wrap('dashboard:ta_head', 60, async () => {
      // 1. Requisition status breakdown
      const allReqs = await this.reqRepo.find({ relations: ['department'] });
      const reqStatusCounts: Record<string, number> = {};
      for (const req of allReqs) {
        reqStatusCounts[req.status] = (reqStatusCounts[req.status] || 0) + 1;
      }

      // 2. Full pipeline funnel
      const allApps = await this.appRepo.find();
      const funnelCounts: Record<string, number> = {};
      for (const stage of STAGE_ORDER) {
        funnelCounts[stage] = 0;
      }
      for (const app of allApps) {
        if (funnelCounts[app.stage] !== undefined) {
          funnelCounts[app.stage]++;
        }
      }

      // 3. Department hiring breakdown
      const deptStats: Record<string, { name: string; openReqs: number; totalCandidates: number }> = {};
      for (const req of allReqs) {
        const deptName = req.department?.name || 'General';
        if (!deptStats[deptName]) {
          deptStats[deptName] = { name: deptName, openReqs: 0, totalCandidates: 0 };
        }
        if (req.status === RequisitionStatus.OPEN) {
          deptStats[deptName].openReqs++;
        }
      }

      // 4. Joining overview
      const checklists = await this.joiningRepo.find();
      const totalJoined = allApps.filter((a) => a.stage === ApplicationStage.JOINED).length;
      const pendingJoining = checklists.filter((c) => c.status !== 'COMPLETED').length;

      // 5. Average time to hire calculation
      const joinedApps = allApps.filter((a) => a.stage === ApplicationStage.JOINED && a.updatedAt && a.appliedDate);
      let avgTimeToHireDays = 32; // reasonable default benchmark
      if (joinedApps.length > 0) {
        const totalDays = joinedApps.reduce((acc, a) => {
          const diffDays = (new Date(a.updatedAt).getTime() - new Date(a.appliedDate).getTime()) / (1000 * 60 * 60 * 24);
          return acc + Math.max(1, diffDays);
        }, 0);
        avgTimeToHireDays = Math.round(totalDays / joinedApps.length);
      }

      return {
        overview: {
          totalRequisitions: allReqs.length,
          openRequisitions: reqStatusCounts[RequisitionStatus.OPEN] || 0,
          totalCandidates: allApps.length,
          totalJoined,
          pendingJoining,
          averageTimeToHireDays: avgTimeToHireDays,
        },
        requisitionStatusCounts: reqStatusCounts,
        pipelineFunnel: funnelCounts,
        departmentBreakdown: Object.values(deptStats),
      };
    });
  }

  /**
   * Department Head Dashboard (Strictly scoped to user's department)
   */
  async getDeptHeadDashboard(departmentId: string) {
    if (!departmentId) {
      throw new BadRequestException('Department ID is required to view Department Head Dashboard');
    }

    return this.cache.wrap(`dashboard:dept_head:${departmentId}`, 60, async () => {
      const department = await this.deptRepo.findOne({ where: { id: departmentId } });
      if (!department) {
        throw new BadRequestException(`Department with ID ${departmentId} does not exist`);
      }

      // 1. Strictly filter requisitions by this departmentId
      const requisitions = await this.reqRepo.find({
        where: { departmentId },
        order: { createdAt: 'DESC' },
      });

      const reqIds = requisitions.map((r) => r.id);

      // 2. Applications for this department
      let applications: Application[] = [];
      if (reqIds.length > 0) {
        applications = await this.appRepo.find({
          where: { requisitionId: In(reqIds) },
          relations: ['candidate', 'requisition'],
          order: { appliedDate: 'DESC' },
        });
      }

      // 3. Stage breakdown for this department
      const stageCounts: Record<string, number> = {};
      for (const stage of STAGE_ORDER) {
        stageCounts[stage] = 0;
      }
      for (const app of applications) {
        if (stageCounts[app.stage] !== undefined) {
          stageCounts[app.stage]++;
        }
      }

      // 4. Interviews for this department
      const now = new Date();
      const upcomingInterviews = reqIds.length > 0
        ? await this.interviewRepo.find({
            where: {
              application: { requisitionId: In(reqIds) },
              scheduledStartTime: Between(now, new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)),
            },
            relations: ['application', 'application.candidate', 'panelists', 'panelists.user'],
            take: 10,
            order: { scheduledStartTime: 'ASC' },
          })
        : [];

      // 5. Joining candidates for this department
      const appIds = applications.map((a) => a.id);
      const joiningChecklists = appIds.length > 0
        ? await this.joiningRepo.find({
            where: { applicationId: In(appIds) },
            relations: ['candidate', 'items'],
          })
        : [];

      return {
        department: {
          id: department.id,
          name: department.name,
          code: department.code,
        },
        activeRequisitionsCount: requisitions.filter((r) => r.status === RequisitionStatus.OPEN).length,
        totalCandidatesCount: applications.length,
        requisitions: requisitions.map((r) => ({
          id: r.id,
          requisitionNumber: r.requisitionNumber,
          title: r.title,
          status: r.status,
          headcount: r.headcount,
          targetHireDate: r.targetHireDate,
        })),
        pipelineByStage: stageCounts,
        upcomingInterviews,
        joiningReadiness: joiningChecklists.map((c) => ({
          checklistId: c.id,
          candidateName: c.candidate ? `${c.candidate.firstName} ${c.candidate.lastName}` : 'N/A',
          joiningDate: c.joiningDate,
          status: c.status,
          readinessPercentage: Number(c.readinessPercentage),
        })),
      };
    });
  }
}
