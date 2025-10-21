import { Module } from '@nestjs/common';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Comment, CommentSchema } from 'src/schemas/comment.schema';
import { News, NewsSchema } from 'src/schemas/news.schema';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: Comment.name, schema: CommentSchema }, { name: News.name, schema: NewsSchema }])
  ],
  controllers: [CommentController],
  providers: [CommentService]
})
export class CommentModule {}
