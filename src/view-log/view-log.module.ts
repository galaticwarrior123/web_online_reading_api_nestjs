import { Module } from '@nestjs/common';
import { ViewLogController } from './view-log.controller';
import { ViewLogService } from './view-log.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ViewLog, ViewLogSchema } from 'src/schemas/viewLog.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: ViewLog.name, schema: ViewLogSchema }])],
  controllers: [ViewLogController],
  providers: [ViewLogService]
})
export class ViewLogModule {}
