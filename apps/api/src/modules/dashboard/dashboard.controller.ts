import { Controller, Get, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RbacGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('recruiter')
  @Permissions('dashboard:read')
  async getRecruiterDashboard(@CurrentUser() user: any) {
    return this.dashboardService.getRecruiterDashboard(user.id);
  }

  @Get('ta-head')
  @Permissions('dashboard:read')
  async getTaHeadDashboard() {
    return this.dashboardService.getTaHeadDashboard();
  }

  @Get('dept-head')
  @Permissions('dashboard:read')
  async getDeptHeadDashboard(
    @CurrentUser() user: any,
    @Query('departmentId') queryDeptId?: string,
  ) {
    // Strictly scoped: department head can only view their own department
    // TA Admin can pass queryDeptId
    const departmentId = queryDeptId || user.departmentId;
    if (!departmentId) {
      throw new BadRequestException(
        'User is not associated with any department. Please specify departmentId.',
      );
    }
    return this.dashboardService.getDeptHeadDashboard(departmentId);
  }
}
