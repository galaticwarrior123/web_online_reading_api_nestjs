import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ViewLog, ViewLogSchema } from 'src/schemas/viewLog.schema';
import { News, NewsSchema } from 'src/schemas/news.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: ViewLog.name, schema: ViewLogSchema }, { name: News.name, schema: NewsSchema }])],
  controllers: [DashboardController],
  providers: [DashboardService]
})
export class DashboardModule {}
