import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JoiningChecklist } from './entities/joining-checklist.entity';
import { JoiningChecklistItem } from './entities/joining-checklist-item.entity';
import { JoiningService } from './joining.service';
import { JoiningController } from './joining.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      JoiningChecklist,
      JoiningChecklistItem,
    ]),
  ],
  controllers: [JoiningController],
  providers: [JoiningService],
  exports: [JoiningService, TypeOrmModule],
})
export class JoiningModule {}
