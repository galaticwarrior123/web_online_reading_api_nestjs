import { Module } from '@nestjs/common';
import { NotificationGateway } from './notification.gateway';
import { MongooseModule } from '@nestjs/mongoose';
import { Notification, NotificationSchema } from 'src/schemas/notification.schema';
import { User, UserSchema } from 'src/schemas/user.schema';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { News, NewsSchema } from 'src/schemas/news.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Notification.name, schema: NotificationSchema }, { name: User.name, schema: UserSchema }, { name: News.name, schema: NewsSchema }])
  ],
  controllers: [NotificationController],
  providers: [NotificationService]
})
export class NotificationModule { }
