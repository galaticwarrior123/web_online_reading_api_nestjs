import { Module } from '@nestjs/common';
import { NewsController } from './news.controller';
import { News, NewsSchema } from 'src/schemas/news.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { NewsService } from './news.service';
import { Category, CategorySchema } from 'src/schemas/category.schema';
import { OpenAIService } from 'src/openai/openAI.service';
import { TagsService } from 'src/tags/tags.service';
import { NotificationGateway } from 'src/notification/notification.gateway';
import { User, UserSchema } from 'src/schemas/user.schema';
import { NewsRevision, NewsRevisionSchema } from 'src/schemas/newsRevision.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: News.name, schema: NewsSchema }, 
      { name: Category.name, schema: CategorySchema},
      { name: User.name, schema: UserSchema},
      { name: NewsRevision.name, schema: NewsRevisionSchema }
    ])
  ],
  controllers: [NewsController],
  providers: [NewsService, TagsService, NotificationGateway]
})
export class NewsModule {}
