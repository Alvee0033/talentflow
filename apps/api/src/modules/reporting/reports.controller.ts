import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard, RbacGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('pipeline-velocity')
  @Permissions('report:read')
  async getPipelineVelocity() {
    return this.reportsService.getPipelineVelocity();
  }

  @Get('source-effectiveness')
  @Permissions('report:read')
  async getSourceEffectiveness() {
    return this.reportsService.getSourceEffectiveness();
  }

  @Get('recruiter-performance')
  @Permissions('report:read')
  async getRecruiterPerformance() {
    return this.reportsService.getRecruiterPerformance();
  }

  @Get('department-hiring')
  @Permissions('report:read')
  async getDepartmentHiring() {
    return this.reportsService.getDepartmentHiring();
  }

  @Get('export')
  @Permissions('report:export')
  async exportReport(
    @Query('reportType') reportType: string,
    @Query('format') format: string = 'xlsx',
    @Res() res: Response,
  ) {
    if (!reportType) {
      throw new BadRequestException('reportType query parameter is required');
    }

    const exportFormat = format.toLowerCase() === 'csv' ? 'csv' : 'xlsx';
    const buffer = await this.reportsService.exportReport(reportType, exportFormat);

    const contentType = exportFormat === 'csv'
      ? 'text/csv'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    const filename = `${reportType}-${new Date().toISOString().slice(0, 10)}.${exportFormat}`;

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }
}
