import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as XLSX from 'xlsx';
import { Application } from '../candidate/entities/application.entity';
import { Candidate } from '../candidate/entities/candidate.entity';
import { Requisition } from '../requisition/entities/requisition.entity';
import { Department } from '../organization/entities/department.entity';
import { ApplicationStage, STAGE_ORDER, CandidateSourceType } from '@talentflow/shared';
import { RedisCacheService } from '../../common/cache/redis-cache.service';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Application)
    private readonly appRepo: Repository<Application>,
    @InjectRepository(Candidate)
    private readonly candRepo: Repository<Candidate>,
    @InjectRepository(Requisition)
    private readonly reqRepo: Repository<Requisition>,
    @InjectRepository(Department)
    private readonly deptRepo: Repository<Department>,
    private readonly cache: RedisCacheService,
  ) {}

  async getPipelineVelocity() {
    return this.cache.wrap('report:pipeline_velocity', 120, async () => {
      const apps = await this.appRepo.find({
        relations: ['stageHistories'],
      });

      const stageVelocity: Record<string, { totalDays: number; count: number; averageDays: number }> = {};
      for (const stage of STAGE_ORDER) {
        stageVelocity[stage] = { totalDays: 0, count: 0, averageDays: 0 };
      }

      for (const app of apps) {
        const histories = app.stageHistories || [];
        for (let i = 0; i < histories.length; i++) {
          const h = histories[i];
          const nextTime = histories[i + 1]?.createdAt ? new Date(histories[i + 1].createdAt).getTime() : Date.now();
          const curTime = new Date(h.createdAt).getTime();
          const days = Math.max(0.5, (nextTime - curTime) / (1000 * 60 * 60 * 24));

          if (stageVelocity[h.toStage]) {
            stageVelocity[h.toStage].totalDays += days;
            stageVelocity[h.toStage].count += 1;
          }
        }
      }

      for (const stage of STAGE_ORDER) {
        const s = stageVelocity[stage];
        s.averageDays = s.count > 0 ? Number((s.totalDays / s.count).toFixed(1)) : 0;
      }

      return Object.entries(stageVelocity).map(([stage, stats]) => ({
        stage,
        averageDays: stats.averageDays,
        totalCandidatesProcessed: stats.count,
      }));
    });
  }

  async getSourceEffectiveness() {
    return this.cache.wrap('report:source_effectiveness', 120, async () => {
      const candidates = await this.candRepo.find({
        where: { isAnonymized: false },
        relations: ['applications'],
      });

      const sources: Record<string, { total: number; screened: number; selected: number; joined: number }> = {};
      for (const s of Object.values(CandidateSourceType)) {
        sources[s] = { total: 0, screened: 0, selected: 0, joined: 0 };
      }

      for (const cand of candidates) {
        const src = cand.source || CandidateSourceType.MANUAL;
        if (!sources[src]) sources[src] = { total: 0, screened: 0, selected: 0, joined: 0 };
        sources[src].total++;

        for (const app of cand.applications || []) {
          if (app.stage !== ApplicationStage.NEW) {
            sources[src].screened++;
          }
          if (app.stage === ApplicationStage.SELECTED || app.stage === ApplicationStage.JOINING || app.stage === ApplicationStage.JOINED) {
            sources[src].selected++;
          }
          if (app.stage === ApplicationStage.JOINED) {
            sources[src].joined++;
          }
        }
      }

      return Object.entries(sources).map(([source, data]) => ({
        source,
        totalCandidates: data.total,
        screenedCandidates: data.screened,
        selectedCandidates: data.selected,
        joinedCandidates: data.joined,
        conversionRatePercentage: data.total > 0 ? Number(((data.joined / data.total) * 100).toFixed(1)) : 0,
      }));
    });
  }

  async getRecruiterPerformance() {
    return this.cache.wrap('report:recruiter_performance', 120, async () => {
      const reqs = await this.reqRepo.find();
      const apps = await this.appRepo.find({ relations: ['requisition'] });

      const recruiters: Record<string, { recruiterId: string; totalRequisitions: number; totalHires: number; activePipeline: number }> = {};

      for (const r of reqs) {
        const recId = r.assignedRecruiterId || 'unassigned';
        if (!recruiters[recId]) {
          recruiters[recId] = { recruiterId: recId, totalRequisitions: 0, totalHires: 0, activePipeline: 0 };
        }
        recruiters[recId].totalRequisitions++;
      }

      for (const a of apps) {
        const recId = a.requisition?.assignedRecruiterId || 'unassigned';
        if (!recruiters[recId]) {
          recruiters[recId] = { recruiterId: recId, totalRequisitions: 0, totalHires: 0, activePipeline: 0 };
        }
        if (a.stage === ApplicationStage.JOINED) {
          recruiters[recId].totalHires++;
        } else {
          recruiters[recId].activePipeline++;
        }
      }

      return Object.values(recruiters);
    });
  }

  async getDepartmentHiring() {
    return this.cache.wrap('report:department_hiring', 120, async () => {
      const depts = await this.deptRepo.find();
      const reqs = await this.reqRepo.find();
      const apps = await this.appRepo.find({ relations: ['requisition'] });

      return depts.map((dept) => {
        const deptReqs = reqs.filter((r) => r.departmentId === dept.id);
        const deptReqIds = deptReqs.map((r) => r.id);
        const deptApps = apps.filter((a) => a.requisitionId && deptReqIds.includes(a.requisitionId));
        const hiredCount = deptApps.filter((a) => a.stage === ApplicationStage.JOINED).length;

        return {
          departmentId: dept.id,
          departmentName: dept.name,
          departmentCode: dept.code,
          openRequisitionsCount: deptReqs.filter((r) => r.status === 'OPEN').length,
          totalRequisitionsCount: deptReqs.length,
          candidatesInPipeline: deptApps.length,
          totalHired: hiredCount,
        };
      });
    });
  }

  async exportReport(reportType: string, format: 'csv' | 'xlsx'): Promise<Buffer> {
    let data: any[] = [];
    let sheetName = 'Report';

    switch (reportType) {
      case 'pipeline-velocity':
        data = await this.getPipelineVelocity();
        sheetName = 'Pipeline Velocity';
        break;
      case 'source-effectiveness':
        data = await this.getSourceEffectiveness();
        sheetName = 'Source Effectiveness';
        break;
      case 'recruiter-performance':
        data = await this.getRecruiterPerformance();
        sheetName = 'Recruiter Performance';
        break;
      case 'department-hiring':
        data = await this.getDepartmentHiring();
        sheetName = 'Department Hiring';
        break;
      default:
        throw new BadRequestException(`Unknown report type: ${reportType}`);
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    const bookType = format === 'csv' ? 'csv' : 'xlsx';
    const buffer = XLSX.write(wb, { type: 'buffer', bookType });
    return buffer as Buffer;
  }
}
