import { Module } from '@nestjs/common';
import { ImageController } from './image.controller';
import { ImageService } from './image.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Image, ImageSchema } from 'src/schemas/image.schema';
import { User, UserSchema } from 'src/schemas/user.schema';
import { News, NewsSchema } from 'src/schemas/news.schema';
import { NotificationGateway } from 'src/notification/notification.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Image.name, schema: ImageSchema },
      { name: User.name, schema: UserSchema},
      { name: News.name, schema: NewsSchema},
    ])
  ],
  controllers: [ImageController],
  providers: [ImageService, NotificationGateway]
})
export class ImageModule {}
