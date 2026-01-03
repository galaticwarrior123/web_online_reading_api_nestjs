import { Module } from '@nestjs/common';
import { NewsRevisionController } from './news-revision.controller';
import { NewsRevisionService } from './news-revision.service';
import { MongooseModule } from '@nestjs/mongoose';
import { NewsRevision, NewsRevisionSchema } from 'src/schemas/newsRevision.schema';
import { News, NewsSchema } from 'src/schemas/news.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NewsRevision.name, schema: NewsRevisionSchema },
      { name: News.name, schema: NewsSchema }
    ])
  ],
  controllers: [NewsRevisionController],
  providers: [NewsRevisionService]
})
export class NewsRevisionModule {}
