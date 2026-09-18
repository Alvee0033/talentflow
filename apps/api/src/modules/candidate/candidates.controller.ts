import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CandidatesService } from './candidates.service';
import { DuplicateDetectionService } from './duplicate-detection.service';
import { CandidateImportService } from './candidate-import.service';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';
import { CheckDuplicateDto } from './dto/check-duplicate.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('candidates')
@UseGuards(JwtAuthGuard, RbacGuard)
export class CandidatesController {
  constructor(
    private readonly candidatesService: CandidatesService,
    private readonly duplicateDetectionService: DuplicateDetectionService,
    private readonly candidateImportService: CandidateImportService,
  ) {}

  @Post()
  @Permissions('candidate:create')
  async create(@Body() dto: CreateCandidateDto) {
    return this.candidatesService.create(dto);
  }

  @Get()
  @Permissions('candidate:read')
  async findAll(
    @Query('search') search?: string,
    @Query('source') source?: string,
    @Query('tag') tag?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.candidatesService.findAll({ search, source, tag, page, limit });
  }

  @Post('check-duplicates')
  @Permissions('candidate:read')
  async checkDuplicates(@Body() dto: CheckDuplicateDto) {
    return this.duplicateDetectionService.checkDuplicates(dto);
  }

  @Post('import')
  @Permissions('candidate:create')
  @UseInterceptors(FileInterceptor('file'))
  async importFile(
    @UploadedFile() file: any,
    @Query('requisitionId') requisitionId?: string,
    @CurrentUser() user?: any,
  ) {
    if (!file) {
      throw new BadRequestException('Please upload a spreadsheet file (.csv, .xlsx)');
    }
    return this.candidateImportService.importFile(file.buffer, requisitionId, user?.id);
  }

  @Get(':id')
  @Permissions('candidate:read')
  async findOne(@Param('id') id: string) {
    return this.candidatesService.findById(id);
  }

  @Patch(':id')
  @Permissions('candidate:update')
  async update(@Param('id') id: string, @Body() dto: UpdateCandidateDto) {
    return this.candidatesService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('candidate:delete')
  async remove(@Param('id') id: string) {
    return this.candidatesService.remove(id);
  }

  @Post(':id/anonymize')
  @Permissions('candidate:delete')
  async anonymize(@Param('id') id: string) {
    return this.candidatesService.anonymizeCandidate(id);
  }
}
