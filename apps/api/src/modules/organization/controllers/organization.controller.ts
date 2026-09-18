import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { OrganizationService } from '../services/organization.service';
import { CreateBusinessUnitDto } from '../dto/create-business-unit.dto';
import { UpdateBusinessUnitDto } from '../dto/update-business-unit.dto';
import { CreateDepartmentDto } from '../dto/create-department.dto';
import { UpdateDepartmentDto } from '../dto/update-department.dto';
import { CreatePositionDto } from '../dto/create-position.dto';
import { UpdatePositionDto } from '../dto/update-position.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../../common/guards/rbac.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { ParseUUIDPipe } from '../../../common/pipes/parse-uuid.pipe';

@ApiTags('Organization')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller('organization')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  // ====================================================
  // BUSINESS UNITS
  // ====================================================

  @Post('business-units')
  @Permissions('organization:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new business unit' })
  @ApiResponse({ status: 201, description: 'Business unit created' })
  async createBusinessUnit(@Body() dto: CreateBusinessUnitDto) {
    return this.organizationService.createBusinessUnit(dto);
  }

  @Get('business-units')
  @Permissions('organization:read')
  @ApiOperation({ summary: 'List all business units' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  async findAllBusinessUnits(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('isActive') isActive?: boolean,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ) {
    if (!page && !limit && !search && isActive === undefined) {
      return this.organizationService.findAllBusinessUnits();
    }
    return this.organizationService.findAllBusinessUnits({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      search,
      isActive: isActive !== undefined ? String(isActive) === 'true' : undefined,
      sortBy,
      sortOrder,
    });
  }

  @Get('business-units/:id')
  @Permissions('organization:read')
  @ApiOperation({ summary: 'Get business unit details by ID' })
  async findBusinessUnitById(@Param('id', ParseUUIDPipe) id: string) {
    return this.organizationService.findBusinessUnitById(id);
  }

  @Put('business-units/:id')
  @Permissions('organization:update')
  @ApiOperation({ summary: 'Update business unit by ID' })
  async updateBusinessUnit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBusinessUnitDto,
  ) {
    return this.organizationService.updateBusinessUnit(id, dto);
  }

  @Delete('business-units/:id')
  @Permissions('organization:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete business unit by ID' })
  async deleteBusinessUnit(@Param('id', ParseUUIDPipe) id: string) {
    await this.organizationService.deleteBusinessUnit(id);
  }

  // ====================================================
  // DEPARTMENTS
  // ====================================================

  @Post('departments')
  @Permissions('organization:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new department' })
  @ApiResponse({ status: 201, description: 'Department created' })
  async createDepartment(@Body() dto: CreateDepartmentDto) {
    return this.organizationService.createDepartment(dto);
  }

  @Get('departments')
  @Permissions('organization:read')
  @ApiOperation({ summary: 'List departments with optional business unit filter' })
  @ApiQuery({ name: 'businessUnitId', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  async findAllDepartments(
    @Query('businessUnitId') businessUnitId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('isActive') isActive?: boolean,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ) {
    if (!page && !limit && !search && isActive === undefined && !businessUnitId) {
      return this.organizationService.findAllDepartments();
    }
    return this.organizationService.findAllDepartments({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      businessUnitId,
      search,
      isActive: isActive !== undefined ? String(isActive) === 'true' : undefined,
      sortBy,
      sortOrder,
    });
  }

  @Get('departments/:id')
  @Permissions('organization:read')
  @ApiOperation({ summary: 'Get department details by ID' })
  async findDepartmentById(@Param('id', ParseUUIDPipe) id: string) {
    return this.organizationService.findDepartmentById(id);
  }

  @Put('departments/:id')
  @Permissions('organization:update')
  @ApiOperation({ summary: 'Update department by ID' })
  async updateDepartment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDepartmentDto,
  ) {
    return this.organizationService.updateDepartment(id, dto);
  }

  @Delete('departments/:id')
  @Permissions('organization:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete department by ID' })
  async deleteDepartment(@Param('id', ParseUUIDPipe) id: string) {
    await this.organizationService.deleteDepartment(id);
  }

  // ====================================================
  // POSITIONS
  // ====================================================

  @Post('positions')
  @Permissions('organization:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new position' })
  @ApiResponse({ status: 201, description: 'Position created' })
  async createPosition(@Body() dto: CreatePositionDto) {
    return this.organizationService.createPosition(dto);
  }

  @Get('positions')
  @Permissions('organization:read')
  @ApiOperation({ summary: 'List positions with optional department filter' })
  @ApiQuery({ name: 'departmentId', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  async findAllPositions(
    @Query('departmentId') departmentId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('isActive') isActive?: boolean,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ) {
    if (!page && !limit && !search && isActive === undefined && !departmentId) {
      return this.organizationService.findAllPositions();
    }
    return this.organizationService.findAllPositions({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      departmentId,
      search,
      isActive: isActive !== undefined ? String(isActive) === 'true' : undefined,
      sortBy,
      sortOrder,
    });
  }

  @Get('positions/:id')
  @Permissions('organization:read')
  @ApiOperation({ summary: 'Get position details by ID' })
  async findPositionById(@Param('id', ParseUUIDPipe) id: string) {
    return this.organizationService.findPositionById(id);
  }

  @Put('positions/:id')
  @Permissions('organization:update')
  @ApiOperation({ summary: 'Update position by ID' })
  async updatePosition(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePositionDto,
  ) {
    return this.organizationService.updatePosition(id, dto);
  }

  @Delete('positions/:id')
  @Permissions('organization:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete position by ID' })
  async deletePosition(@Param('id', ParseUUIDPipe) id: string) {
    await this.organizationService.deletePosition(id);
  }
}
