import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RequisitionStatus } from '@talentflow/shared';
import { RequisitionsService } from '../services/requisitions.service';
import { RequisitionApprovalService } from '../services/requisition-approval.service';
import { CreateRequisitionDto } from '../dto/create-requisition.dto';
import { UpdateRequisitionDto } from '../dto/update-requisition.dto';
import { ChangeStatusDto } from '../dto/change-status.dto';
import { AssignRecruiterDto } from '../dto/assign-recruiter.dto';
import { SubmitApprovalDto, ActionApprovalDto } from '../dto/submit-approval.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../../common/guards/rbac.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ParseUUIDPipe } from '../../../common/pipes/parse-uuid.pipe';

@ApiTags('Requisitions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller('requisitions')
export class RequisitionsController {
  constructor(
    private readonly requisitionsService: RequisitionsService,
    private readonly approvalService: RequisitionApprovalService,
  ) {}

  @Get()
  @Permissions('requisition:read')
  @ApiOperation({ summary: 'List requisitions with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: RequisitionStatus })
  @ApiQuery({ name: 'businessUnitId', required: false, type: String })
  @ApiQuery({ name: 'departmentId', required: false, type: String })
  @ApiQuery({ name: 'positionId', required: false, type: String })
  @ApiQuery({ name: 'hiringManagerId', required: false, type: String })
  @ApiQuery({ name: 'assignedRecruiterId', required: false, type: String })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: RequisitionStatus,
    @Query('businessUnitId') businessUnitId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('positionId') positionId?: string,
    @Query('hiringManagerId') hiringManagerId?: string,
    @Query('assignedRecruiterId') assignedRecruiterId?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ) {
    return this.requisitionsService.findAll({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      search,
      status,
      businessUnitId,
      departmentId,
      positionId,
      hiringManagerId,
      assignedRecruiterId,
      sortBy,
      sortOrder,
    });
  }

  @Post()
  @Permissions('requisition:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new job requisition' })
  @ApiResponse({ status: 201, description: 'Requisition created successfully' })
  async create(
    @Body() dto: CreateRequisitionDto,
    @CurrentUser() user: any,
  ) {
    return this.requisitionsService.create(dto, user.id);
  }

  @Get(':id')
  @Permissions('requisition:read')
  @ApiOperation({ summary: 'Get requisition details by ID' })
  @ApiResponse({ status: 200, description: 'Requisition found' })
  @ApiResponse({ status: 404, description: 'Requisition not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.requisitionsService.findById(id);
  }

  @Put(':id')
  @Permissions('requisition:update')
  @ApiOperation({ summary: 'Update requisition by ID' })
  @ApiResponse({ status: 200, description: 'Requisition updated successfully' })
  @ApiResponse({ status: 404, description: 'Requisition not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRequisitionDto,
  ) {
    return this.requisitionsService.update(id, dto);
  }

  @Patch(':id/status')
  @Permissions('requisition:update')
  @ApiOperation({ summary: 'Transition requisition status' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid transition' })
  async changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeStatusDto,
  ) {
    return this.requisitionsService.changeStatus(id, dto);
  }

  @Post(':id/assign-recruiter')
  @Permissions('requisition:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign a recruiter to a requisition' })
  @ApiResponse({ status: 200, description: 'Recruiter assigned successfully' })
  async assignRecruiter(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignRecruiterDto,
  ) {
    return this.requisitionsService.assignRecruiter(id, dto.recruiterId);
  }

  @Post(':id/submit-approval')
  @Permissions('requisition:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit requisition for approval with approver chain' })
  @ApiResponse({ status: 200, description: 'Submitted for approval' })
  async submitForApproval(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitApprovalDto,
  ) {
    return this.approvalService.submitForApproval(id, dto.approverIds, dto.notes);
  }

  @Post(':id/approve')
  @Permissions('requisition:approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve current step for requisition' })
  @ApiResponse({ status: 200, description: 'Step approved' })
  async approve(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
    @Body() dto?: ActionApprovalDto,
  ) {
    return this.approvalService.approve(id, user.id, dto?.comments);
  }

  @Post(':id/reject')
  @Permissions('requisition:approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject requisition and return to draft' })
  @ApiResponse({ status: 200, description: 'Requisition rejected' })
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
    @Body('reason') reason: string,
  ) {
    return this.approvalService.reject(id, user.id, reason || 'Rejected by approver');
  }

  @Get(':id/approvals')
  @Permissions('requisition:read')
  @ApiOperation({ summary: 'Get approval history for requisition' })
  async getApprovals(@Param('id', ParseUUIDPipe) id: string) {
    return this.approvalService.getApprovals(id);
  }

  @Delete(':id')
  @Permissions('requisition:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete requisition by ID' })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.requisitionsService.delete(id);
  }
}
