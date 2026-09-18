import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { EvaluationsService } from './evaluations.service';
import { SubmitEvaluationDto } from './dto/submit-evaluation.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('evaluations')
@UseGuards(JwtAuthGuard, RbacGuard)
export class EvaluationsController {
  constructor(private readonly evaluationsService: EvaluationsService) {}

  @Post()
  @Permissions('evaluation:create')
  async submit(@Body() dto: SubmitEvaluationDto, @CurrentUser() user: any) {
    return this.evaluationsService.saveOrSubmit(dto, user.id);
  }

  @Get('interview/:interviewId')
  @Permissions('evaluation:read')
  async getInterviewEvaluations(
    @Param('interviewId') interviewId: string,
    @CurrentUser() user: any,
  ) {
    return this.evaluationsService.getInterviewEvaluations(interviewId, user);
  }

  @Get(':id')
  @Permissions('evaluation:read')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.evaluationsService.findById(id, user);
  }
}
